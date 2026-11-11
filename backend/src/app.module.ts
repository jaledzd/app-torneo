import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SaludModule } from './salud/salud.module';

@Module({
  imports: [SaludModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
