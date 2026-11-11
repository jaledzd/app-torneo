import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoEntity } from './dominio/evento.entity';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventoEntity])],
  controllers: [EventosController],
  providers: [EventosService],
  exports: [EventosService],
})
export class EventosModule {}
