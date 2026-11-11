import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideojuegoEntity } from './dominio/videojuego.entity';
import { VideojuegosController } from './videojuegos.controller';
import { VideojuegosService } from './videojuegos.service';

@Module({
  imports: [TypeOrmModule.forFeature([VideojuegoEntity])],
  controllers: [VideojuegosController],
  providers: [VideojuegosService],
  exports: [VideojuegosService, TypeOrmModule],
})
export class VideojuegosModule {}
