import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipanteEntity } from '../participantes/dominio/participante.entity';
import { MovimientoApuchiCoinEntity } from './dominio/movimiento-apuchicoin.entity';
import { ApuchiCoinsController } from './apuchicoins.controller';
import { ApuchiCoinsService } from './apuchicoins.service';

@Module({
  imports: [TypeOrmModule.forFeature([MovimientoApuchiCoinEntity, ParticipanteEntity])],
  controllers: [ApuchiCoinsController],
  providers: [ApuchiCoinsService],
  exports: [ApuchiCoinsService],
})
export class ApuchiCoinsModule {}
