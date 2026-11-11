import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { SaludController } from '../src/salud/salud.controller';
import { SaludService } from '../src/salud/salud.service';
import { EventosController } from '../src/eventos/eventos.controller';
import { EventosService } from '../src/eventos/eventos.service';

describe('API HTTP (e2e)', () => {
  let app: INestApplication;

  const eventosService = {
    crear: jest.fn().mockResolvedValue({
      id: 'c3f7d2bd-04c1-4a78-8b4a-8b3c0e3c5c20',
      estado: 'BORRADOR',
      premio: 'Premio del torneo',
    }),
    listar: jest.fn().mockResolvedValue([]),
    obtenerPorId: jest.fn(),
    actualizar: jest.fn(),
    iniciar: jest.fn(),
    cerrarEnfrentamientos: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SaludController, EventosController],
      providers: [
        {
          provide: SaludService,
          useValue: {
            obtenerEstado: () => ({
              estado: 'ok',
              mensaje: 'La API está funcionando correctamente',
              entorno: 'test',
            }),
          },
        },
        { provide: EventosService, useValue: eventosService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /salud devuelve el estado de la API', async () => {
    await request(app.getHttpServer())
      .get('/salud')
      .expect(200)
      .expect(({ body }) => expect(body.estado).toBe('ok'));
  });

  it('POST /eventos acepta un DTO válido', async () => {
    await request(app.getHttpServer())
      .post('/eventos')
      .send({
        fechaInicio: '2030-06-10T10:00:00.000Z',
        fechaCierreEnfrentamientos: '2030-06-10T18:00:00.000Z',
        duracionPeriodoAdicionalMinutos: 30,
        premio: 'Premio del torneo',
      })
      .expect(201)
      .expect(({ body }) => expect(body.estado).toBe('BORRADOR'));
  });

  it('POST /eventos rechaza propiedades que no estén declaradas en el DTO', async () => {
    await request(app.getHttpServer())
      .post('/eventos')
      .send({
        fechaInicio: '2030-06-10T10:00:00.000Z',
        fechaCierreEnfrentamientos: '2030-06-10T18:00:00.000Z',
        duracionPeriodoAdicionalMinutos: 30,
        premio: 'Premio del torneo',
        estado: 'EN_CURSO',
      })
      .expect(400);
  });

  it('GET /eventos/:id rechaza identificadores que no sean UUID', async () => {
    await request(app.getHttpServer()).get('/eventos/no-es-un-uuid').expect(400);
  });
});
