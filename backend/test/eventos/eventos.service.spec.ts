import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventosService } from '../../src/eventos/eventos.service';
import { EventoEntity } from '../../src/eventos/dominio/evento.entity';
import { EstadoEvento } from '../../src/eventos/dominio/estado-evento.enum';

describe('EventosService', () => {
  let service: EventosService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      create: jest.fn((input) => input as EventoEntity),
      save: jest.fn(async (entity) => entity as EventoEntity),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    service = new EventosService(repository as unknown as Repository<EventoEntity>);
  });

  it('crea una edición en estado BORRADOR', async () => {
    const evento = await service.crear({
      fechaInicio: '2030-06-10T10:00:00.000Z',
      fechaCierreEnfrentamientos: '2030-06-10T18:00:00.000Z',
      duracionPeriodoAdicionalMinutos: 30,
      premio: 'Consola',
    });

    expect(evento.estado).toBe(EstadoEvento.BORRADOR);
    expect(evento.fechaInicio).toBeInstanceOf(Date);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('rechaza una fecha de cierre anterior o igual al inicio', async () => {
    await expect(service.crear({
      fechaInicio: '2030-06-10T10:00:00.000Z',
      fechaCierreEnfrentamientos: '2030-06-10T10:00:00.000Z',
      duracionPeriodoAdicionalMinutos: 30,
      premio: 'Consola',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza premios vacíos después de eliminar espacios', async () => {
    await expect(service.crear({
      fechaInicio: '2030-06-10T10:00:00.000Z',
      fechaCierreEnfrentamientos: '2030-06-10T18:00:00.000Z',
      duracionPeriodoAdicionalMinutos: 30,
      premio: '   ',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lanza NotFoundException cuando la edición no existe', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.obtenerPorId('no-existe')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza cambios de configuración fuera de BORRADOR', async () => {
    repository.findOne.mockResolvedValue({
      id: 'id',
      estado: EstadoEvento.EN_CURSO,
      fechaInicio: new Date('2030-06-10T10:00:00.000Z'),
      fechaCierreEnfrentamientos: new Date('2030-06-10T18:00:00.000Z'),
    } as EventoEntity);

    await expect(service.actualizar('id', { premio: 'Otro premio' }))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
