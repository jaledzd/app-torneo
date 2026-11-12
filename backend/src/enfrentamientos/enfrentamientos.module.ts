import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApuchiCoinsModule } from '../apuchicoins/apuchicoins.module';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { ParticipanteEntity } from '../participantes/dominio/participante.entity';
import { PuestoEntity } from '../puestos/dominio/puesto.entity';
import { VideojuegoEntity } from '../videojuegos/dominio/videojuego.entity';

import { PartidaEntity } from './dominio/partida.entity';
import { RetoEntity } from './dominio/reto.entity';
import { EnfrentamientosService } from './enfrentamientos.service';
import {
  EnfrentamientosController,
  MisPartidasController,
} from './enfrentamientos.controller';

@Module({
  imports: [
    ApuchiCoinsModule,
    TypeOrmModule.forFeature([
      EventoEntity,
      ParticipanteEntity,
      PuestoEntity,
      VideojuegoEntity,
      PartidaEntity,
      RetoEntity,
    ]),
  ],
  controllers: [
    EnfrentamientosController,
    MisPartidasController,
  ],
  providers: [EnfrentamientosService],
  exports: [EnfrentamientosService],
})
export class EnfrentamientosModule {}
