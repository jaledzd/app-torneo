import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SaludModule } from './salud/salud.module';
import { EventosModule } from './eventos/eventos.module';

@Module({
  imports: [SaludModule, EventosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
