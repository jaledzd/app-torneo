import 'reflect-metadata';
import { DataSource } from 'typeorm';
import 'dotenv/config';

/**
 * DataSource utilizado por TypeORM CLI para ejecutar y revertir migraciones.
 * Se mantiene separado de la configuración de NestJS para que las
 * herramientas de migración puedan ejecutarse fuera del servidor HTTP.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'apuchitorneo',
  password: process.env.DB_PASSWORD ?? 'apuchitorneo',
  database: process.env.DB_DATABASE ?? 'apuchitorneo',
  synchronize: false,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
});
