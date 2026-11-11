import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { ParticipanteEntity } from '../participantes/dominio/participante.entity';
import { PuestoEntity } from '../puestos/dominio/puesto.entity';
import { VideojuegoEntity } from '../videojuegos/dominio/videojuego.entity';
import { PartidaEntity } from './dominio/partida.entity';
import { RetoEntity } from './dominio/reto.entity';
import { EnfrentamientosController } from './enfrentamientos.controller';
import { EnfrentamientosService } from './enfrentamientos.service';
@Module({
  imports: [TypeOrmModule.forFeature([EventoEntity, ParticipanteEntity, PuestoEntity, VideojuegoEntity, PartidaEntity, RetoEntity])],
  controllers: [EnfrentamientosController],
  providers: [EnfrentamientosService],
  exports: [EnfrentamientosService],
})
export class EnfrentamientosModule {}
