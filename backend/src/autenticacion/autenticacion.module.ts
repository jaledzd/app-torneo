import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioEntity } from '../usuarios/dominio/usuario.entity';
import { AutenticacionController } from './autenticacion.controller';
import { AutenticacionService } from './autenticacion.service';
import { EstrategiaJwt } from './estrategias/estrategia-jwt';
import { GuardiaJwt } from './guardias/guardia-jwt';
import { GuardiaRoles } from './guardias/guardia-roles';
@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configuracion: ConfigService) => ({ secret: configuracion.getOrThrow<string>('JWT_SECRETO'), signOptions: { expiresIn: '8h' } }),
    }),
  ],
  controllers: [AutenticacionController],
  providers: [AutenticacionService, EstrategiaJwt, GuardiaJwt, GuardiaRoles],
  exports: [AutenticacionService, GuardiaJwt, GuardiaRoles],
})
export class AutenticacionModule {}
