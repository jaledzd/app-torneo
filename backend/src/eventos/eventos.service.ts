import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
      fechaInicio: inicio,
      fechaCierreEnfrentamientos: cierre,
      duracionPeriodoAdicionalMinutos: dto.duracionPeriodoAdicionalMinutos,
      premio,
      estado: EstadoEvento.BORRADOR,
    }));
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
    return this.eventosRepository.find({ relations: { anfitrion: true }, order: { creadoEn: 'DESC' } });
  }

  async obtenerPorId(id: string): Promise<EventoEntity> {
    const evento = await this.eventosRepository.findOne({ where: { id }, relations: { anfitrion: true } });
    if (!evento) throw new NotFoundException('No se ha encontrado la edición');
    return evento;
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