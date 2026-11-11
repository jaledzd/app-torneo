import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoApuchiCoinEntity } from './dominio/movimiento-apuchicoin.entity';
import { ApuchiCoinsService } from './apuchicoins.service';
@Module({
  imports: [TypeOrmModule.forFeature([MovimientoApuchiCoinEntity])],
  providers: [ApuchiCoinsService],
  exports: [ApuchiCoinsService, TypeOrmModule],
})
export class ApuchiCoinsModule {}
