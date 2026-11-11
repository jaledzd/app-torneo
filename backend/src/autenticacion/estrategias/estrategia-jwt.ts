import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioEntity } from '../../usuarios/dominio/usuario.entity';
/** Comprueba firma, caducidad y vigencia de la cuenta asociada al token. */
@Injectable()
export class EstrategiaJwt extends PassportStrategy(Strategy) {
  constructor(configuracion: ConfigService, @InjectRepository(UsuarioEntity) private readonly usuarios: Repository<UsuarioEntity>) {
    const secreto = configuracion.get<string>('JWT_SECRETO');
    if (!secreto || secreto.length < 32) throw new Error('JWT_SECRETO debe tener al menos 32 caracteres');
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), ignoreExpiration: false, secretOrKey: secreto });
  }
  async validate(carga: { sub: string; correo: string }) {
    const usuario = await this.usuarios.findOne({ where: { id: carga.sub, activo: true } });
    if (!usuario || usuario.email !== carga.correo) throw new UnauthorizedException('La cuenta del token ya no está disponible');
    return { id: usuario.id, email: usuario.email, rol: usuario.rol };
  }
}
