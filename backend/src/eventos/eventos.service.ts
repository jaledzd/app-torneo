import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsuarioAutenticado } from '../autenticacion/dominio/usuario-autenticado.interface';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { UsuarioEntity } from '../usuarios/dominio/usuario.entity';
import { AsignarAnfitrionDto } from './dto/asignar-anfitrion.dto';
import { EventoEntity } from './dominio/evento.entity';
import { EstadoEvento } from './dominio/estado-evento.enum';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';

/** Casos de uso del ciclo de vida. Las mutaciones bloquean la edición en PostgreSQL. */
@Injectable()
export class EventosService {
  constructor(
    private readonly fuenteDatos: DataSource,
    @InjectRepository(EventoEntity) private readonly eventosRepository: Repository<EventoEntity>,
  ) {}

  async crear(dto: CrearEventoDto, actor: UsuarioAutenticado): Promise<EventoEntity> {
    const inicio = new Date(dto.fechaInicio);
    const cierre = new Date(dto.fechaCierreEnfrentamientos);
    this.validarFechas(inicio, cierre);
    const premio = dto.premio.trim();
    if (!premio) throw new BadRequestException('El premio no puede estar vacío');
    return this.eventosRepository.save(this.eventosRepository.create({
      anfitrionId: actor.id,
      codigoAcceso: await this.generarCodigoAcceso(),
      fechaInicio: inicio,
      fechaCierreEnfrentamientos: cierre,
      duracionPeriodoAdicionalMinutos: dto.duracionPeriodoAdicionalMinutos,
      premio,
      estado: EstadoEvento.BORRADOR,
    }));
  }

  async obtenerCodigoAcceso(id: string, actor: UsuarioAutenticado): Promise<{ codigo: string }> {
    const evento = await this.eventosRepository.createQueryBuilder('evento')
      .addSelect('evento.codigoAcceso')
      .where('evento.id = :id', { id })
      .getOne();
    if (!evento) throw new NotFoundException('No se ha encontrado la edición');
    this.autorizar(evento, actor);
    return { codigo: evento.codigoAcceso };
  }

  async regenerarCodigoAcceso(id: string, actor: UsuarioAutenticado): Promise<{ codigo: string }> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const repo = gestor.getRepository(EventoEntity);
      const evento = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      this.autorizar(evento, actor);
      evento.codigoAcceso = await this.generarCodigoAcceso(repo);
      await repo.save(evento);
      return { codigo: evento.codigoAcceso };
    });
  }

  private async generarCodigoAcceso(repo = this.eventosRepository): Promise<string> {
    for (let intento = 0; intento < 30; intento++) {
      const codigo = String(randomInt(100000, 1000000));
      const existente = await repo.findOne({ where: { codigoAcceso: codigo } });
      if (!existente) return codigo;
    }
    throw new BadRequestException('No se ha podido generar un código único. Inténtalo de nuevo.');
  }

  async asignarAnfitrion(id: string, dto: AsignarAnfitrionDto, actor: UsuarioAutenticado): Promise<EventoEntity> {
    if (actor.rol !== RolUsuario.ADMINISTRADOR) throw new ForbiddenException('Solo un administrador puede reasignar el anfitrión');
    return this.fuenteDatos.transaction(async (gestor) => {
      const eventos = gestor.getRepository(EventoEntity);
      const evento = await eventos.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      const anfitrion = await gestor.getRepository(UsuarioEntity).findOne({
        where: { id: dto.anfitrionId, rol: RolUsuario.ANFITRION, activo: true },
      });
      if (!anfitrion) throw new BadRequestException('La cuenta indicada debe existir, estar activa y tener rol ANFITRION');
      evento.anfitrionId = anfitrion.id;
      return eventos.save(evento);
    });
  }

  listar(): Promise<EventoEntity[]> {
    return this.eventosRepository.createQueryBuilder('evento')
      .leftJoin('evento.anfitrion', 'anfitrion')
      .select([
        'evento.id', 'evento.anfitrionId', 'evento.fechaInicio',
        'evento.fechaCierreEnfrentamientos', 'evento.duracionPeriodoAdicionalMinutos',
        'evento.premio', 'evento.estado', 'evento.orlaCerradaEn', 'evento.creadoEn',
        'anfitrion.id', 'anfitrion.nombreVisible',
      ])
      .orderBy('evento.creadoEn', 'DESC').getMany();
  }

  async obtenerPorId(id: string): Promise<EventoEntity> {
    const evento = await this.eventosRepository.createQueryBuilder('evento')
      .leftJoin('evento.anfitrion', 'anfitrion')
      .select([
        'evento.id', 'evento.anfitrionId', 'evento.fechaInicio',
        'evento.fechaCierreEnfrentamientos', 'evento.duracionPeriodoAdicionalMinutos',
        'evento.premio', 'evento.estado', 'evento.orlaCerradaEn', 'evento.creadoEn',
        'anfitrion.id', 'anfitrion.nombreVisible',
      ])
      .where('evento.id = :id', { id }).getOne();
    if (!evento) throw new NotFoundException('No se ha encontrado la edición');
    return evento;
  }

  /**
   * Elimina definitivamente una edición y todos sus datos dependientes.
   * Se borran primero los registros que tienen FKs RESTRICT hacia partidas,
   * participantes, papeletas y puestos.
   */
  async eliminar(id: string, actor: UsuarioAutenticado): Promise<{ mensaje: string }> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const repo = gestor.getRepository(EventoEntity);
      const evento = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      this.autorizar(evento, actor);

      // Libro de movimientos: referencia tanto a participantes como a partidas.
      await gestor.query(
        'DELETE FROM "movimientos_apuchicoins" WHERE "evento_id" = $1',
        [id],
      );

      // El sorteo referencia la papeleta ganadora y al participante ganador.
      await gestor.query('DELETE FROM "sorteos" WHERE "evento_id" = $1', [id]);
      await gestor.query('DELETE FROM "papeletas" WHERE "evento_id" = $1', [id]);

      // Los retos mantienen referencias RESTRICT a los participantes.
      await gestor.query('DELETE FROM "retos" WHERE "evento_id" = $1', [id]);

      // Las reservas bloquean la eliminación de participantes activos.
      await gestor.query(
        `DELETE FROM "partidas_jugadores_activos"
         WHERE "participante_id" IN (
           SELECT "id" FROM "participantes" WHERE "evento_id" = $1
         )`,
        [id],
      );

      // Las partidas referencian participantes y puestos con ON DELETE RESTRICT.
      await gestor.query('DELETE FROM "partidas" WHERE "evento_id" = $1', [id]);
      await gestor.query('DELETE FROM "puestos" WHERE "evento_id" = $1', [id]);
      await gestor.query('DELETE FROM "participantes" WHERE "evento_id" = $1', [id]);

      await repo.delete(id);

      return { mensaje: 'La edición y todos sus datos asociados se han eliminado definitivamente' };
    });
  }

  async actualizar(id: string, dto: ActualizarEventoDto, actor: UsuarioAutenticado): Promise<EventoEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const repo = gestor.getRepository(EventoEntity);
      const evento = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      this.autorizar(evento, actor);
      if (evento.estado !== EstadoEvento.BORRADOR) throw new BadRequestException('Solo se pueden modificar ediciones en BORRADOR');
      const inicio = dto.fechaInicio ? new Date(dto.fechaInicio) : evento.fechaInicio;
      const cierre = dto.fechaCierreEnfrentamientos ? new Date(dto.fechaCierreEnfrentamientos) : evento.fechaCierreEnfrentamientos;
      this.validarFechas(inicio, cierre);
      if (dto.fechaInicio !== undefined) evento.fechaInicio = inicio;
      if (dto.fechaCierreEnfrentamientos !== undefined) evento.fechaCierreEnfrentamientos = cierre;
      if (dto.duracionPeriodoAdicionalMinutos !== undefined) evento.duracionPeriodoAdicionalMinutos = dto.duracionPeriodoAdicionalMinutos;
      if (dto.premio !== undefined) {
        const premio = dto.premio.trim();
        if (!premio) throw new BadRequestException('El premio no puede estar vacío');
        evento.premio = premio;
      }
      return repo.save(evento);
    });
  }

  async iniciar(id: string, actor: UsuarioAutenticado): Promise<EventoEntity> {
    return this.transicionar(id, actor, EstadoEvento.BORRADOR, EstadoEvento.EN_CURSO, (evento) => {
      if (Date.now() < evento.fechaInicio.getTime()) throw new BadRequestException('Todavía no ha llegado la fecha de inicio configurada');
      if (Date.now() >= evento.fechaCierreEnfrentamientos.getTime()) throw new BadRequestException('La hora de cierre de enfrentamientos ya ha pasado');
    });
  }

  async cerrarEnfrentamientos(id: string, actor: UsuarioAutenticado): Promise<EventoEntity> {
    return this.transicionar(id, actor, EstadoEvento.EN_CURSO, EstadoEvento.PERIODO_ADICIONAL, (evento) => {
      if (Date.now() < evento.fechaCierreEnfrentamientos.getTime()) throw new BadRequestException('Todavía no ha llegado la hora de cierre');
    });
  }

  private async transicionar(
    id: string,
    actor: UsuarioAutenticado,
    desde: EstadoEvento,
    hasta: EstadoEvento,
    validar: (evento: EventoEntity) => void,
  ): Promise<EventoEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const repo = gestor.getRepository(EventoEntity);
      const evento = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      this.autorizar(evento, actor);
      if (evento.estado !== desde) throw new BadRequestException('La edición ya no se encuentra en la fase esperada');
      validar(evento);
      evento.estado = hasta;
      return repo.save(evento);
    });
  }

  private autorizar(evento: EventoEntity, actor: UsuarioAutenticado): void {
    if (actor.rol !== RolUsuario.ADMINISTRADOR && evento.anfitrionId !== actor.id) {
      throw new ForbiddenException('Solo el anfitrión responsable o un administrador puede gestionar esta edición');
    }
  }

  private validarFechas(inicio: Date, cierre: Date): void {
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(cierre.getTime())) throw new BadRequestException('Las fechas proporcionadas no son válidas');
    if (cierre.getTime() <= inicio.getTime()) throw new BadRequestException('La fecha de cierre debe ser posterior al inicio');
  }
}
