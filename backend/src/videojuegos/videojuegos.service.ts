import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VideojuegoEntity } from './dominio/videojuego.entity';
import { CrearVideojuegoDto } from './dto/crear-videojuego.dto';

@Injectable()
export class VideojuegosService {
  constructor(@InjectRepository(VideojuegoEntity) private readonly repositorio: Repository<VideojuegoEntity>) {}

  async crear(datos: CrearVideojuegoDto): Promise<VideojuegoEntity> {
    const nombre = datos.nombre.trim();
    if (await this.repositorio.findOne({ where: { nombre } })) {
      throw new ConflictException('Ya existe un videojuego con ese nombre');
    }
    return this.repositorio.save(this.repositorio.create({
      nombre,
      plataforma: datos.plataforma?.trim() || null,
      activo: true,
    }));
  }

  listar(): Promise<VideojuegoEntity[]> {
    return this.repositorio.find({ where: { activo: true }, relations: { puestosCompatibles: true }, order: { nombre: 'ASC' } });
  }

  async obtenerActivos(ids: string[]): Promise<VideojuegoEntity[]> {
    if (ids.length === 0) return [];
    return this.repositorio.find({ where: { id: In(ids), activo: true } });
  }
}
