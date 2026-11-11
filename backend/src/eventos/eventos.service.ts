import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventoEntity } from './dominio/evento.entity';
import { EstadoEvento } from './dominio/estado-evento.enum';
import { CrearEventoDto } from './dto/crear-evento.dto';
import { ActualizarEventoDto } from './dto/actualizar-evento.dto';

/**
 * Casos de uso y reglas de negocio de las ediciones del torneo.
 * Las transiciones usan UPDATE condicional para evitar que dos peticiones
 * simultáneas cambien el estado partiendo de la misma fase.
 */
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
    const premio = dto.premio.trim();
    if (!premio) throw new BadRequestException('El premio no puede estar vacío');

    const evento = this.eventosRepository.create({
      fechaInicio: inicio,
      fechaCierreEnfrentamientos: cierre,
      duracionPeriodoAdicionalMinutos: dto.duracionPeriodoAdicionalMinutos,
      premio,
      estado: EstadoEvento.BORRADOR,
    });
    return this.eventosRepository.save(evento);
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

    const cambios: Partial<EventoEntity> = {};
    if (dto.fechaInicio !== undefined) cambios.fechaInicio = inicio;
    if (dto.fechaCierreEnfrentamientos !== undefined) cambios.fechaCierreEnfrentamientos = cierre;
    if (dto.duracionPeriodoAdicionalMinutos !== undefined) cambios.duracionPeriodoAdicionalMinutos = dto.duracionPeriodoAdicionalMinutos;
    if (dto.premio !== undefined) {
      const premio = dto.premio.trim();
      if (!premio) throw new BadRequestException('El premio no puede estar vacío');
      cambios.premio = premio;
    }

    if (Object.keys(cambios).length === 0) return evento;

    // La condición estado=BORRADOR evita sobrescribir una edición que haya
    // cambiado de fase mientras se procesaba la petición.
    const resultado = await this.eventosRepository.update(
      { id, estado: EstadoEvento.BORRADOR },
      cambios,
    );
    if (!resultado.affected) {
      throw new BadRequestException('La edición ha cambiado de estado; vuelve a consultar antes de modificarla');
    }
    return this.obtenerPorId(id);
  }

  async iniciar(id: string): Promise<EventoEntity> {
    const evento = await this.obtenerPorId(id);
    if (evento.estado !== EstadoEvento.BORRADOR) {
      throw new BadRequestException('Solo se puede iniciar una edición en estado BORRADOR');
    }
    if (Date.now() < evento.fechaInicio.getTime()) {
      throw new BadRequestException('Todavía no ha llegado la fecha de inicio configurada');
    }

    const resultado = await this.eventosRepository.update(
      { id, estado: EstadoEvento.BORRADOR },
      { estado: EstadoEvento.EN_CURSO },
    );
    if (!resultado.affected) {
      throw new BadRequestException('La edición ya ha cambiado de estado');
    }
    return this.obtenerPorId(id);
  }

  async cerrarEnfrentamientos(id: string): Promise<EventoEntity> {
    const evento = await this.obtenerPorId(id);
    if (evento.estado !== EstadoEvento.EN_CURSO) {
      throw new BadRequestException('Solo se pueden cerrar enfrentamientos de una edición EN_CURSO');
    }
    if (Date.now() < evento.fechaCierreEnfrentamientos.getTime()) {
      throw new BadRequestException('Todavía no ha llegado la hora de cierre de enfrentamientos');
    }

    const resultado = await this.eventosRepository.update(
      { id, estado: EstadoEvento.EN_CURSO },
      { estado: EstadoEvento.PERIODO_ADICIONAL },
    );
    if (!resultado.affected) {
      throw new BadRequestException('La edición ya ha cambiado de estado');
    }
    return this.obtenerPorId(id);
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
