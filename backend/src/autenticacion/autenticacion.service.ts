import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';
import { UsuarioEntity } from '../usuarios/dominio/usuario.entity';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
const scrypt = promisify(scryptCallback);
/** Verifica credenciales y emite tokens de acceso. */
@Injectable()
export class AutenticacionService {
  constructor(@InjectRepository(UsuarioEntity) private readonly usuarios: Repository<UsuarioEntity>, private readonly jwt: JwtService) {}
  async iniciarSesion(datos: IniciarSesionDto) {
    const email = datos.email.trim().toLowerCase();
    const usuario = await this.usuarios.createQueryBuilder('usuario').addSelect('usuario.contrasenaHash')
      .where('usuario.email = :email', { email }).andWhere('usuario.activo = true').getOne();
    if (!usuario || !await this.comprobarContrasena(datos.contrasena, usuario.contrasenaHash)) {
      throw new UnauthorizedException('Correo electrónico o contraseña incorrectos');
    }
    const tokenAcceso = await this.jwt.signAsync({ sub: usuario.id, correo: usuario.email, rol: usuario.rol });
    return { tipo: 'Bearer', tokenAcceso, usuario: { id: usuario.id, email: usuario.email, nombreVisible: usuario.nombreVisible, rol: usuario.rol } };
  }
  private async comprobarContrasena(contrasena: string, almacenada: string): Promise<boolean> {
    const [sal, claveHex] = almacenada.split(':');
    if (!sal || !claveHex || !/^[a-f0-9]{128}$/i.test(claveHex)) return false;
    const esperada = Buffer.from(claveHex, 'hex');
    const calculada = (await scrypt(contrasena, sal, esperada.length)) as Buffer;
    return esperada.length === calculada.length && timingSafeEqual(esperada, calculada);
  }
}
