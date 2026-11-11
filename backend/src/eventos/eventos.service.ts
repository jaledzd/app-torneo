import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventoEntity } from './dominio/evento.entity';
import { EstadoEvento } from './dominio/estado-evento.enum';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';

/** Casos de uso y reglas de negocio de las ediciones del torneo. */
@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(EventoEntity)
    private readonly eventosRepository: Repository<EventoEntity>,
  ) {}

  async crear(dto: CrearEventoDto): Promise<EventoEntity> {
    const inicio = new Date(dto.fechaInicio);
    const cierre = new Date(dto.fechaCierreEnfrentamientos);
    this.validarFechas(inicio, cierre);

    return this.eventosRepository.save(this.eventosRepository.create({
      fechaInicio: inicio,
      fechaCierreEnfrentamientos: cierre,
      duracionPeriodoAdicionalMinutos: dto.duracionPeriodoAdicionalMinutos,
      premio: dto.premio.trim(),
      estado: EstadoEvento.BORRADOR,
    }));
  }

  listar(): Promise<EventoEntity[]> {
    return this.eventosRepository.find({ order: { creadoEn: 'DESC' } });
  }

  async obtenerPorId(id: string): Promise<EventoEntity> {
    const evento = await this.eventosRepository.findOne({ where: { id } });
    if (!evento) throw new NotFoundException(`No existe la edición con identificador ${id}`);
    return evento;
  }

  async actualizar(id: string, dto: ActualizarEventoDto): Promise<EventoEntity> {
    const evento = await this.obtenerPorId(id);
    if (evento.estado !== EstadoEvento.BORRADOR) {
      throw new BadRequestException('Solo se pueden modificar ediciones en estado BORRADOR');
    }

    const inicio = dto.fechaInicio ? new Date(dto.fechaInicio) : evento.fechaInicio;
    const cierre = dto.fechaCierreEnfrentamientos
      ? new Date(dto.fechaCierreEnfrentamientos)
      : evento.fechaCierreEnfrentamientos;
    this.validarFechas(inicio, cierre);

    if (dto.fechaInicio !== undefined) evento.fechaInicio = inicio;
    if (dto.fechaCierreEnfrentamientos !== undefined) evento.fechaCierreEnfrentamientos = cierre;
    if (dto.duracionPeriodoAdicionalMinutos !== undefined) evento.duracionPeriodoAdicionalMinutos = dto.duracionPeriodoAdicionalMinutos;
    if (dto.premio !== undefined) evento.premio = dto.premio.trim();

    return this.eventosRepository.save(evento);
  }

  async iniciar(id: string): Promise<EventoEntity> {
    const evento = await this.obtenerPorId(id);
    if (evento.estado !== EstadoEvento.BORRADOR) {
      throw new BadRequestException('Solo se puede iniciar una edición en estado BORRADOR');
    }
    if (evento.fechaInicio.getTime() <= Date.now()) {
      throw new BadRequestException('La fecha de inicio debe estar en el futuro para iniciar la edición');
    }
    evento.estado = EstadoEvento.EN_CURSO;
    return this.eventosRepository.save(evento);
  }

  private validarFechas(inicio: Date, cierre: Date): void {
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(cierre.getTime())) {
      throw new BadRequestException('Las fechas proporcionadas no son válidas');
    }
    if (cierre.getTime() <= inicio.getTime()) {
      throw new BadRequestException('La fecha de cierre debe ser posterior al inicio');
    }
  }
}
