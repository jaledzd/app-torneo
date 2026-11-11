import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { UsuarioEntity } from '../usuarios/dominio/usuario.entity';
import { ParticipanteEntity } from './dominio/participante.entity';
import { ParticipantesController } from './participantes.controller';
import { ParticipantesService } from './participantes.service';

@Module({
  imports: [TypeOrmModule.forFeature([ParticipanteEntity, EventoEntity, UsuarioEntity])],
  controllers: [ParticipantesController],
  providers: [ParticipantesService],
  exports: [ParticipantesService, TypeOrmModule],
})
export class ParticipantesModule {}
