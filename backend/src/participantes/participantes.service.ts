import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { EstadoEvento } from '../eventos/dominio/estado-evento.enum';
import { UsuarioEntity } from '../usuarios/dominio/usuario.entity';
import { ParticipanteEntity } from './dominio/participante.entity';
import { EstadoParticipante } from './dominio/estado-participante.enum';

/** Gestiona la inscripción de cuentas en cada edición. */
@Injectable()
export class ParticipantesService {
  constructor(
    private readonly fuenteDatos: DataSource,
    @InjectRepository(ParticipanteEntity) private readonly participantes: Repository<ParticipanteEntity>,
    @InjectRepository(EventoEntity) private readonly eventos: Repository<EventoEntity>,
    @InjectRepository(UsuarioEntity) private readonly usuarios: Repository<UsuarioEntity>,
  ) {}

  async inscribir(eventoId: string, usuarioId: string): Promise<ParticipanteEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({
        where: { id: eventoId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      if (evento.estado !== EstadoEvento.BORRADOR && evento.estado !== EstadoEvento.EN_CURSO) {
        throw new BadRequestException('La edición no admite nuevas inscripciones');
      }
      const usuario = await gestor.getRepository(UsuarioEntity).findOne({ where: { id: usuarioId, activo: true } });
      if (!usuario) throw new NotFoundException('No se ha encontrado una cuenta activa con ese identificador');
      const repo = gestor.getRepository(ParticipanteEntity);
      const anterior = await repo.findOne({ where: { eventoId, usuarioId } });
      if (anterior) {
        if (anterior.estado === EstadoParticipante.INSCRITO) throw new ConflictException('La cuenta ya está inscrita en esta edición');
        anterior.estado = EstadoParticipante.INSCRITO;
        return repo.save(anterior);
      }
      return repo.save(repo.create({ eventoId, usuarioId, estado: EstadoParticipante.INSCRITO, saldoApuchiCoins: 0 }));
    });
  }

  async listar(eventoId: string): Promise<ParticipanteEntity[]> {
    const evento = await this.eventos.findOne({ where: { id: eventoId } });
    if (!evento) throw new NotFoundException('No se ha encontrado la edición');
    return this.participantes.find({
      where: { eventoId, estado: EstadoParticipante.INSCRITO },
      relations: { usuario: true },
      order: { inscritoEn: 'ASC' },
    });
  }

  async retirar(eventoId: string, participanteId: string): Promise<ParticipanteEntity> {
    const participante = await this.participantes.findOne({ where: { id: participanteId, eventoId } });
    if (!participante) throw new NotFoundException('No se ha encontrado la inscripción');
    if (participante.estado !== EstadoParticipante.INSCRITO) throw new BadRequestException('La inscripción ya está retirada');
    participante.estado = EstadoParticipante.RETIRADO;
    return this.participantes.save(participante);
  }
}
