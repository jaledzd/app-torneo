import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SaludModule } from './salud/salud.module';
import { EventosModule } from './eventos/eventos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ParticipantesModule } from './participantes/participantes.module';
import { DatabaseModule } from './database/database.module';

/** Módulo raíz de la API. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SaludModule,
    EventosModule,
    UsuariosModule,
    ParticipantesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
