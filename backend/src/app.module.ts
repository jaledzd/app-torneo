import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SaludModule } from './salud/salud.module';
import { EventosModule } from './eventos/eventos.module';
import { DatabaseModule } from './database/database.module';

/** Módulo raíz: configuración, persistencia y capacidades de negocio. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SaludModule,
    EventosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
