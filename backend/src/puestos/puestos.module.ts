import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { VideojuegoEntity } from '../videojuegos/dominio/videojuego.entity';
import { PuestoEntity } from './dominio/puesto.entity';
import { PuestosController } from './puestos.controller';
import { PuestosService } from './puestos.service';

@Module({
  imports: [TypeOrmModule.forFeature([PuestoEntity, EventoEntity, VideojuegoEntity])],
  controllers: [PuestosController],
  providers: [PuestosService],
  exports: [PuestosService, TypeOrmModule],
})
export class PuestosModule {}
