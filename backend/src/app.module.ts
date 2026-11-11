import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SaludModule } from './salud/salud.module';
import { EventosModule } from './eventos/eventos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ParticipantesModule } from './participantes/participantes.module';
import { VideojuegosModule } from './videojuegos/videojuegos.module';
import { PuestosModule } from './puestos/puestos.module';
import { AutenticacionModule } from './autenticacion/autenticacion.module';
import { GuardiaJwt } from './autenticacion/guardias/guardia-jwt';
import { GuardiaRoles } from './autenticacion/guardias/guardia-roles';
import { DatabaseModule } from './database/database.module';
/** Módulo raíz y protección global de rutas mediante JWT. */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, AutenticacionModule, SaludModule, EventosModule, UsuariosModule, ParticipantesModule, VideojuegosModule, PuestosModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: GuardiaJwt }, { provide: APP_GUARD, useClass: GuardiaRoles }],
})
export class AppModule {}
