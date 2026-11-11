import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { PartidaEntity } from '../enfrentamientos/dominio/partida.entity';
import { ParticipanteEntity } from '../participantes/dominio/participante.entity';
import { PapeletaEntity } from './dominio/papeleta.entity';
import { SorteoEntity } from './dominio/sorteo.entity';
import { OrlaController } from './orla.controller';
import { OrlaService } from './orla.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventoEntity, PartidaEntity, ParticipanteEntity, PapeletaEntity, SorteoEntity])],
  controllers: [OrlaController],
  providers: [OrlaService],
  exports: [OrlaService],
})
export class OrlaModule {}
