import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { UsuarioAutenticado } from '../autenticacion/dominio/usuario-autenticado.interface';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { EstadoEvento } from '../eventos/dominio/estado-evento.enum';
import { VideojuegoEntity } from '../videojuegos/dominio/videojuego.entity';
import { PuestoEntity } from './dominio/puesto.entity';
import { CrearPuestoDto } from './dto/crear-puesto.dto';

@Injectable()
export class PuestosService {
  constructor(
    private readonly fuenteDatos: DataSource,
    @InjectRepository(PuestoEntity) private readonly puestos: Repository<PuestoEntity>,
    @InjectRepository(EventoEntity) private readonly eventos: Repository<EventoEntity>,
  ) {}

  async crear(eventoId: string, datos: CrearPuestoDto, actor: UsuarioAutenticado): Promise<PuestoEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      if (actor.rol !== RolUsuario.ADMINISTRADOR && evento.anfitrionId !== actor.id) throw new ForbiddenException('No puedes configurar los puestos de esta edición');
      if (evento.estado !== EstadoEvento.BORRADOR) throw new BadRequestException('Los puestos solo se configuran durante BORRADOR');
      const juegos = datos.videojuegosIds.length
        ? await gestor.getRepository(VideojuegoEntity).findBy({ id: In(datos.videojuegosIds) })
        : [];
      if (juegos.length !== new Set(datos.videojuegosIds).size || juegos.some((juego) => !juego.activo)) {
        throw new BadRequestException('La lista contiene videojuegos inexistentes, inactivos o repetidos');
      }
      const puesto = gestor.getRepository(PuestoEntity).create({
        eventoId,
        codigo: datos.codigo.trim(),
        descripcion: datos.descripcion?.trim() || null,
        activo: true,
        videojuegos: juegos,
      });
      return gestor.getRepository(PuestoEntity).save(puesto);
    });
  }

  async listar(eventoId: string): Promise<PuestoEntity[]> {
    if (!await this.eventos.findOne({ where: { id: eventoId } })) throw new NotFoundException('No se ha encontrado la edición');
    return this.puestos.find({ where: { eventoId, activo: true }, relations: { videojuegos: true }, order: { codigo: 'ASC' } });
  }
}
