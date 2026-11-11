import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { DataSource } from 'typeorm';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { EstadoEvento } from '../eventos/dominio/estado-evento.enum';
import { EstadoPartida } from '../enfrentamientos/dominio/estado-partida.enum';
import { PartidaEntity } from '../enfrentamientos/dominio/partida.entity';
import { EstadoParticipante } from '../participantes/dominio/estado-participante.enum';
import { ParticipanteEntity } from '../participantes/dominio/participante.entity';
import { EstadoPapeleta } from './dominio/estado-papeleta.enum';
import { PapeletaEntity } from './dominio/papeleta.entity';
import { SorteoEntity } from './dominio/sorteo.entity';

/** Gestiona la cartera de papeletas, su depósito y el sorteo único de cada edición. */
@Injectable()
export class OrlaService {
  constructor(private readonly fuenteDatos: DataSource) {}

  async emitir(eventoId: string, participanteId: string, cantidad: number): Promise<{ emitidas: number }> {
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 500) throw new BadRequestException('La cantidad debe estar entre 1 y 500');
    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento || ![EstadoEvento.BORRADOR, EstadoEvento.EN_CURSO, EstadoEvento.PERIODO_ADICIONAL].includes(evento.estado)) throw new BadRequestException('No se pueden emitir papeletas en esta fase');
      const limite = evento.fechaCierreEnfrentamientos.getTime() + evento.duracionPeriodoAdicionalMinutos * 60_000;
      if (Date.now() > limite) throw new BadRequestException('El plazo de emisión de papeletas ha terminado');
      const participante = await gestor.getRepository(ParticipanteEntity).findOne({ where: { id: participanteId, eventoId, estado: EstadoParticipante.INSCRITO } });
      if (!participante) throw new NotFoundException('No existe un participante inscrito en esta edición');
      const repo = gestor.getRepository(PapeletaEntity);
      const nuevas = Array.from({ length: cantidad }, () => repo.create({ eventoId, participanteId, estado: EstadoPapeleta.CARTERA, depositadaEn: null }));
      await repo.save(nuevas);
      return { emitidas: nuevas.length };
    });
  }

  async depositar(eventoId: string, usuarioId: string, cantidad: number): Promise<{ depositadas: number; enCartera: number }> {
    if (!Number.isInteger(cantidad) || cantidad < 1) throw new BadRequestException('La cantidad debe ser un entero positivo');
    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento || ![EstadoEvento.EN_CURSO, EstadoEvento.PERIODO_ADICIONAL].includes(evento.estado)) throw new BadRequestException('La orla no está abierta');
      const limite = evento.fechaCierreEnfrentamientos.getTime() + evento.duracionPeriodoAdicionalMinutos * 60_000;
      if (Date.now() > limite) throw new BadRequestException('El plazo de la orla ha terminado');
      const participante = await gestor.getRepository(ParticipanteEntity).findOne({ where: { eventoId, usuarioId, estado: EstadoParticipante.INSCRITO } });
      if (!participante) throw new NotFoundException('No estás inscrito en esta edición');
      const repo = gestor.getRepository(PapeletaEntity);
      const cartera = await repo.createQueryBuilder('p').setLock('pessimistic_write')
        .where('p.evento_id = :eventoId AND p.participante_id = :participanteId AND p.estado = :estado', { eventoId, participanteId: participante.id, estado: EstadoPapeleta.CARTERA })
        .orderBy('p.creada_en', 'ASC').getMany();
      if (cartera.length < cantidad) throw new BadRequestException('No tienes suficientes papeletas en la cartera');
      const seleccionadas = cartera.slice(0, cantidad);
      const ahora = new Date();
      seleccionadas.forEach((papeleta) => { papeleta.estado = EstadoPapeleta.ORLA; papeleta.depositadaEn = ahora; });
      await repo.save(seleccionadas);
      return { depositadas: seleccionadas.length, enCartera: cartera.length - seleccionadas.length };
    });
  }

  async consultar(eventoId: string, usuarioId: string): Promise<{ cartera: number; orla: number }> {
    const participante = await this.fuenteDatos.getRepository(ParticipanteEntity).findOne({ where: { eventoId, usuarioId } });
    if (!participante) throw new NotFoundException('No existe tu inscripción en esta edición');
    const filas = await this.fuenteDatos.getRepository(PapeletaEntity).createQueryBuilder('p')
      .select('p.estado', 'estado').addSelect('COUNT(*)', 'cantidad')
      .where('p.evento_id = :eventoId AND p.participante_id = :participanteId', { eventoId, participanteId: participante.id })
      .groupBy('p.estado').getRawMany<{ estado: EstadoPapeleta; cantidad: string }>();
    return {
      cartera: Number(filas.find((f) => f.estado === EstadoPapeleta.CARTERA)?.cantidad ?? 0),
      orla: Number(filas.find((f) => f.estado === EstadoPapeleta.ORLA)?.cantidad ?? 0),
    };
  }

  async realizarSorteo(eventoId: string): Promise<SorteoEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const eventos = gestor.getRepository(EventoEntity);
      const evento = await eventos.findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      if (evento.estado === EstadoEvento.EN_CURSO && Date.now() >= evento.fechaCierreEnfrentamientos.getTime()) {
        evento.estado = EstadoEvento.PERIODO_ADICIONAL;
        await eventos.save(evento);
      }
      if (evento.estado !== EstadoEvento.PERIODO_ADICIONAL) throw new BadRequestException('El sorteo solo puede realizarse durante el periodo adicional');
      const existente = await gestor.getRepository(SorteoEntity).findOne({ where: { eventoId } });
      if (existente) throw new ConflictException('Esta edición ya tiene un sorteo realizado');
      const partidasActivas = await gestor.getRepository(PartidaEntity).count({ where: { eventoId, estado: EstadoPartida.EN_CURSO } });
      if (partidasActivas > 0) throw new ConflictException('No se puede sortear mientras queden partidas en curso');
      const repo = gestor.getRepository(PapeletaEntity);
      const papeletas = await repo.find({ where: { eventoId, estado: EstadoPapeleta.ORLA } });
      if (papeletas.length === 0) throw new BadRequestException('No hay papeletas depositadas para el sorteo');
      const ganadora = papeletas[randomInt(papeletas.length)];
      ganadora.estado = EstadoPapeleta.GANADORA;
      await repo.save(ganadora);
      const sorteos = gestor.getRepository(SorteoEntity);
      const sorteo = await sorteos.save(sorteos.create({ eventoId, papeletaGanadoraId: ganadora.id, participanteGanadorId: ganadora.participanteId }));
      evento.estado = EstadoEvento.FINALIZADO;
      await eventos.save(evento);
      return sorteo;
    });
  }

  async obtenerSorteo(eventoId: string): Promise<SorteoEntity> {
    const sorteo = await this.fuenteDatos.getRepository(SorteoEntity).findOne({ where: { eventoId } });
    if (!sorteo) throw new NotFoundException('Todavía no se ha realizado el sorteo');
    return sorteo;
  }
}
