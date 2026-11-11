import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Configuración compartida de persistencia.
 *
 * synchronize está desactivado deliberadamente: el esquema se modifica
 * mediante migraciones versionadas, nunca automáticamente al arrancar.
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'apuchitorneo',
      password: process.env.DB_PASSWORD ?? 'apuchitorneo',
      database: process.env.DB_DATABASE ?? 'apuchitorneo',
      autoLoadEntities: true,
      synchronize: false,
      migrationsRun: false,
      retryAttempts: 5,
      retryDelay: 3000,
    }),
  ],
})
export class DatabaseModule {}
