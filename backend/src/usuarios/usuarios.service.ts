import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioEntity } from './dominio/usuario.entity';
import { RolUsuario } from './dominio/rol-usuario.enum';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

const scrypt = promisify(scryptCallback);

/** Casos de uso de cuentas. Las contraseñas nunca se devuelven al cliente. */
@Injectable()
export class UsuariosService {
  constructor(@InjectRepository(UsuarioEntity) private readonly repositorio: Repository<UsuarioEntity>) {}

  async registrar(datos: CrearUsuarioDto): Promise<Omit<UsuarioEntity, 'contrasenaHash'>> {
    const email = datos.email.trim().toLowerCase();
    const existente = await this.repositorio.findOne({ where: { email } });
    if (existente) throw new ConflictException('Ya existe una cuenta con ese correo electrónico');

    const sal = randomBytes(16).toString('hex');
    const derivada = (await scrypt(datos.contrasena, sal, 64)) as Buffer;
    const usuario = this.repositorio.create({
      email,
      nombreVisible: datos.nombreVisible.trim(),
      contrasenaHash: `${sal}:${derivada.toString('hex')}`,
      rol: RolUsuario.PARTICIPANTE,
      activo: true,
    });
    const guardado = await this.repositorio.save(usuario);
    const { contrasenaHash: _secreto, ...publico } = guardado;
    return publico;
  }

  async listar(): Promise<Omit<UsuarioEntity, 'contrasenaHash'>[]> {
    const usuarios = await this.repositorio.find({ order: { creadoEn: 'DESC' } });
    return usuarios.map(({ contrasenaHash: _secreto, ...publico }) => publico);
  }

  async obtener(id: string): Promise<Omit<UsuarioEntity, 'contrasenaHash'>> {
    const usuario = await this.repositorio.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('No se ha encontrado el usuario');
    const { contrasenaHash: _secreto, ...publico } = usuario;
    return publico;
  }
}
