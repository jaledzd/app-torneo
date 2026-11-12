import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApuchiCoinsService } from '../apuchicoins/apuchicoins.service';
import { UsuarioAutenticado } from '../autenticacion/dominio/usuario-autenticado.interface';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { EstadoEvento } from '../eventos/dominio/estado-evento.enum';
import { EstadoParticipante } from '../participantes/dominio/estado-participante.enum';
import { ParticipanteEntity } from '../participantes/dominio/participante.entity';
import { PuestoEntity } from '../puestos/dominio/puesto.entity';
import { VideojuegoEntity } from '../videojuegos/dominio/videojuego.entity';
import { EstadoPartida } from './dominio/estado-partida.enum';
import { PartidaEntity } from './dominio/partida.entity';
import { EstadoReto } from './dominio/estado-reto.enum';
import { RetoEntity } from './dominio/reto.entity';

/** Coordina retos, disponibilidad y reservas transaccionales de recursos. */
@Injectable()
export class EnfrentamientosService {
  constructor(
    private readonly fuenteDatos: DataSource,
    @InjectRepository(RetoEntity) private readonly retos: Repository<RetoEntity>,
    @InjectRepository(PartidaEntity) private readonly partidas: Repository<PartidaEntity>,
    private readonly apuchiCoins: ApuchiCoinsService,
  ) {}

  async enviarReto(eventoId: string, emisorUsuarioId: string, destinatarioParticipanteId: string): Promise<RetoEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento || evento.estado !== EstadoEvento.EN_CURSO || Date.now() >= evento.fechaCierreEnfrentamientos.getTime()) throw new BadRequestException('La edición no admite nuevos retos');
      const repoParticipantes = gestor.getRepository(ParticipanteEntity);
      const emisor = await repoParticipantes.findOne({ where: { eventoId, usuarioId: emisorUsuarioId, estado: EstadoParticipante.INSCRITO }, lock: { mode: 'pessimistic_write' } });
      const destinatario = await repoParticipantes.findOne({ where: { id: destinatarioParticipanteId, eventoId, estado: EstadoParticipante.INSCRITO }, lock: { mode: 'pessimistic_write' } });
      if (!emisor || !destinatario) throw new NotFoundException('Ambos jugadores deben estar inscritos en esta edición');
      if (emisor.id === destinatario.id) throw new BadRequestException('No puedes enviarte un reto a ti mismo');
      const ids = [emisor.id, destinatario.id];
      const ocupados = await gestor.query('SELECT 1 FROM "partidas_jugadores_activos" WHERE "participante_id" = ANY($1::uuid[]) LIMIT 1', [ids]);
      if (ocupados.length) throw new ConflictException('Uno de los jugadores ya está disputando una partida');
      const retosRepo = gestor.getRepository(RetoEntity);
      const pendientes = await retosRepo.find({ where: { eventoId, destinatarioId: destinatario.id, estado: EstadoReto.PENDIENTE } });
      const vigente = pendientes.find((r) => r.caducaEn > new Date());
      if (vigente) throw new ConflictException('El destinatario ya tiene una solicitud pendiente');
      for (const vencido of pendientes) { vencido.estado = EstadoReto.CADUCADO; await retosRepo.save(vencido); }
      const minutos = Number(process.env.RETO_CADUCIDAD_MINUTOS ?? 5);
      const caducidad = Number.isInteger(minutos) && minutos > 0 ? minutos : 5;
      return retosRepo.save(retosRepo.create({ eventoId, emisorId: emisor.id, destinatarioId: destinatario.id, estado: EstadoReto.PENDIENTE, caducaEn: new Date(Date.now() + caducidad * 60_000), partidaId: null }));
    });
  }

  
async aceptarReto(
  eventoId: string,
  retoId: string,
  destinatarioUsuarioId: string,
): Promise<PartidaEntity> {
  return this.fuenteDatos.transaction(async (gestor) => {
    // 1. Bloquear primero la edición.
    const evento = await gestor.getRepository(EventoEntity).findOne({
      where: { id: eventoId },
      lock: { mode: 'pessimistic_write' },
    });

    if (
      !evento ||
      evento.estado !== EstadoEvento.EN_CURSO ||
      Date.now() >= evento.fechaCierreEnfrentamientos.getTime()
    ) {
      throw new BadRequestException(
        'La edición ya no permite iniciar partidas',
      );
    }

    // 2. Bloquear el reto.
    const retosRepo = gestor.getRepository(RetoEntity);
    const reto = await retosRepo.findOne({
      where: { id: retoId, eventoId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!reto) {
      throw new NotFoundException('No se ha encontrado el reto');
    }

    const destinatario = await gestor
      .getRepository(ParticipanteEntity)
      .findOne({
        where: {
          id: reto.destinatarioId,
          eventoId,
          usuarioId: destinatarioUsuarioId,
        },
      });

    if (!destinatario) {
      throw new ForbiddenException(
        'Solo el destinatario puede aceptar este reto',
      );
    }

    if (reto.estado !== EstadoReto.PENDIENTE) {
      throw new ConflictException('El reto ya no está pendiente');
    }

    if (reto.caducaEn <= new Date()) {
      reto.estado = EstadoReto.CADUCADO;
      await retosRepo.save(reto);
      throw new BadRequestException(
        'El plazo de aceptación del reto ha terminado',
      );
    }

    // 3. Bloquear ambos participantes.
    const ids = [reto.emisorId, reto.destinatarioId].sort();

    const participantes = await gestor
      .getRepository(ParticipanteEntity)
      .createQueryBuilder('p')
      .setLock('pessimistic_write')
      .where(
        'p.evento_id = :eventoId AND p.id IN (:...ids) AND p.estado = :estado',
        {
          eventoId,
          ids,
          estado: EstadoParticipante.INSCRITO,
        },
      )
      .getMany();

    if (participantes.length !== 2) {
      throw new BadRequestException(
        'Los dos jugadores deben seguir inscritos',
      );
    }

    // 4. Comprobar que ninguno está disputando otra partida.
    const activos = await gestor.query(
      'SELECT 1 FROM "partidas_jugadores_activos" WHERE "participante_id" = ANY($1::uuid[]) LIMIT 1',
      [ids],
    );

    if (activos.length) {
      throw new ConflictException(
        'Uno de los jugadores ya está disputando una partida',
      );
    }

    // 5. Consultar puestos activos y sus videojuegos compatibles.
    // No aplicamos FOR UPDATE sobre una consulta con LEFT JOIN.
    const puestos = await gestor
      .getRepository(PuestoEntity)
      .createQueryBuilder('puesto')
      .leftJoinAndSelect('puesto.videojuegos', 'videojuego')
      .where('puesto.evento_id = :eventoId', { eventoId })
      .andWhere('puesto.activo = true')
      .andWhere('videojuego.activo = true')
      .orderBy('puesto.codigo', 'ASC')
      .addOrderBy('videojuego.nombre', 'ASC')
      .getMany();

    // 6. Consultar los recursos que ya están ocupados.
    const ocupaciones = await gestor
      .getRepository(PartidaEntity)
      .createQueryBuilder('partida')
      .where('partida.estado = :estado', {
        estado: EstadoPartida.EN_CURSO,
      })
      .andWhere('partida.evento_id = :eventoId', { eventoId })
      .select(['partida.puestoId', 'partida.videojuegoId'])
      .getMany();

    const puestosOcupados = new Set(
      ocupaciones.map((partida) => partida.puestoId),
    );

    const videojuegosOcupados = new Set(
      ocupaciones.map((partida) => partida.videojuegoId),
    );

    // 7. Generar las combinaciones disponibles.
    const combinaciones = puestos.flatMap((puesto) => {
      if (puestosOcupados.has(puesto.id)) {
        return [];
      }

      return puesto.videojuegos
        .filter(
          (juego) =>
            juego.activo &&
            !videojuegosOcupados.has(juego.id),
        )
        .map((juego) => ({
          puestoId: puesto.id,
          videojuegoId: juego.id,
        }));
    });

    if (!combinaciones.length) {
      throw new ConflictException(
        'No hay puestos ni videojuegos compatibles disponibles',
      );
    }

    // 8. Seleccionar una combinación aleatoria.
    const seleccion =
      combinaciones[Math.floor(Math.random() * combinaciones.length)];

    // 9. Bloquear los recursos seleccionados.
    const puestoBloqueado = await gestor
      .getRepository(PuestoEntity)
      .createQueryBuilder('puesto')
      .setLock('pessimistic_write')
      .where('puesto.id = :puestoId', {
        puestoId: seleccion.puestoId,
      })
      .andWhere('puesto.evento_id = :eventoId', { eventoId })
      .andWhere('puesto.activo = true')
      .getOne();

    if (!puestoBloqueado) {
      throw new ConflictException(
        'El puesto seleccionado ya no está disponible',
      );
    }

    const juego = await gestor
      .getRepository(VideojuegoEntity)
      .findOne({
        where: {
          id: seleccion.videojuegoId,
          activo: true,
        },
        lock: { mode: 'pessimistic_write' },
      });

    if (!juego) {
      throw new ConflictException(
        'El videojuego seleccionado ya no está disponible',
      );
    }

    // 10. Volver a comprobar que el puesto y el videojuego
    // continúan libres antes de crear la partida.
    const ocupacionActual = await gestor
      .getRepository(PartidaEntity)
      .createQueryBuilder('partida')
      .where('partida.estado = :estado', {
        estado: EstadoPartida.EN_CURSO,
      })
      .andWhere(
        '(partida.puesto_id = :puestoId OR partida.videojuego_id = :videojuegoId)',
        {
          puestoId: seleccion.puestoId,
          videojuegoId: seleccion.videojuegoId,
        },
      )
      .getCount();

    if (ocupacionActual) {
      throw new ConflictException(
        'El puesto o el videojuego ya está ocupado',
      );
    }

    // 11. Crear la partida.
    const partidasRepo = gestor.getRepository(PartidaEntity);

    const partida = await partidasRepo.save(
      partidasRepo.create({
        eventoId,
        participanteAId: reto.emisorId,
        participanteBId: reto.destinatarioId,
        puestoId: seleccion.puestoId,
        videojuegoId: seleccion.videojuegoId,
        estado: EstadoPartida.EN_CURSO,
        ganadorId: null,
        finalizadaEn: null,
      }),
    );

    // 12. Reservar ambos participantes.
    await gestor.query(
      'INSERT INTO "partidas_jugadores_activos" ("participante_id", "partida_id") VALUES ($1, $3), ($2, $3)',
      [reto.emisorId, reto.destinatarioId, partida.id],
    );

    // 13. Actualizar el reto.
    reto.estado = EstadoReto.ACEPTADO;
    reto.partidaId = partida.id;

    await retosRepo.save(reto);

    return partida;
  });
}


  async rechazarReto(eventoId: string, retoId: string, usuarioId: string): Promise<RetoEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento || evento.estado !== EstadoEvento.EN_CURSO || Date.now() >= evento.fechaCierreEnfrentamientos.getTime()) {
        throw new BadRequestException('La edición ya no admite respuestas a retos');
      }
      const repo = gestor.getRepository(RetoEntity);
      const reto = await repo.findOne({ where: { id: retoId, eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!reto) throw new NotFoundException('No se ha encontrado el reto');
      const destinatario = await gestor.getRepository(ParticipanteEntity).findOne({ where: { id: reto.destinatarioId, eventoId, usuarioId } });
      if (!destinatario) throw new ForbiddenException('Solo el destinatario puede rechazar este reto');
      if (reto.estado !== EstadoReto.PENDIENTE) throw new ConflictException('El reto ya no está pendiente');
      if (reto.caducaEn <= new Date()) {
        reto.estado = EstadoReto.CADUCADO;
        return repo.save(reto);
      }
      reto.estado = EstadoReto.RECHAZADO;
      return repo.save(reto);
    });
  }

  async finalizarPartida(eventoId: string, partidaId: string, ganadorId: string, actor: UsuarioAutenticado): Promise<PartidaEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      if (actor.rol !== RolUsuario.ADMINISTRADOR && evento.anfitrionId !== actor.id) {
        throw new ForbiddenException('Solo el anfitrión responsable o un administrador puede finalizar partidas');
      }
      const repo = gestor.getRepository(PartidaEntity);
      const partida = await repo.findOne({ where: { id: partidaId, eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!partida) throw new NotFoundException('No se ha encontrado la partida');
      if (partida.estado !== EstadoPartida.EN_CURSO) throw new ConflictException('La partida ya está finalizada');
      if (![partida.participanteAId, partida.participanteBId].includes(ganadorId)) throw new BadRequestException('El ganador debe ser uno de los dos participantes');
      partida.estado = EstadoPartida.FINALIZADA;
      partida.ganadorId = ganadorId;
      partida.finalizadaEn = new Date();
      const guardada = await repo.save(partida);
      await gestor.query('DELETE FROM "partidas_jugadores_activos" WHERE "partida_id" = $1', [partida.id]);
      const rivalId = ganadorId === partida.participanteAId ? partida.participanteBId: partida.participanteAId;

      const rival = await gestor
        .getRepository(ParticipanteEntity)
        .findOne({
          where: {
            id: rivalId,
            eventoId,
          },
          relations: {
            usuario: true,
          },
        });

      const videojuego = await gestor
        .getRepository(VideojuegoEntity)
        .findOne({
          where: {
            id: partida.videojuegoId,
        },
      });

      if (!rival || !videojuego) {
        throw new NotFoundException(
          'No se pudo obtener la información de la partida',
        );
      }

      const descripcion =
        `Victoria vs. ${rival.usuario.nombreVisible} — ${videojuego.nombre}`;

      await this.apuchiCoins.acreditarVictoria(
        gestor,
        eventoId,
        ganadorId,
        partida.id,
        descripcion,
      );
        return guardada;
      });
    }

    listarPartidas(eventoId: string): Promise<PartidaEntity[]> {
      return this.partidas.find({
        where: { eventoId },
        relations: {
          participanteA: {
            usuario: true,
          },
          participanteB: {
            usuario: true,
          },
          ganador: {
            usuario: true,
          },
          puesto: true,
          videojuego: true,
        },
        order: {
          iniciadaEn: 'DESC',
        },
      });
    }

  async listarRetosRecibidosPorUsuario(eventoId: string, usuarioId: string): Promise<RetoEntity[]> {
    const participante = await this.fuenteDatos.getRepository(ParticipanteEntity).findOne({ where: { eventoId, usuarioId, estado: EstadoParticipante.INSCRITO } });
    if (!participante) throw new NotFoundException('No estás inscrito en esta edición');
    await this.retos.createQueryBuilder().update(RetoEntity).set({ estado: EstadoReto.CADUCADO })
      .where('evento_id = :eventoId AND destinatario_id = :participanteId AND estado = :estado AND caduca_en <= now()', {
        eventoId, participanteId: participante.id, estado: EstadoReto.PENDIENTE,
      }).execute();
    return this.retos.createQueryBuilder('r').where('r.evento_id = :eventoId AND r.destinatario_id = :participanteId AND r.estado = :estado', { eventoId, participanteId: participante.id, estado: EstadoReto.PENDIENTE }).orderBy('r.creado_en', 'ASC').getMany();
  }

  
async listarDisponibilidadPuestos(eventoId: string) {
  const puestos = await this.fuenteDatos
    .getRepository(PuestoEntity)
    .createQueryBuilder('puesto')
    .leftJoinAndSelect(
      'puesto.videojuegos',
      'videojuego',
      'videojuego.activo = :juegoActivo',
      { juegoActivo: true },
    )
    .where('puesto.evento_id = :eventoId', { eventoId })
    .andWhere('puesto.activo = true')
    .orderBy('puesto.codigo', 'ASC')
    .getMany();

  const ocupados = await this.partidas
    .createQueryBuilder('partida')
    .select('partida.puestoId', 'puestoId')
    .where('partida.eventoId = :eventoId', { eventoId })
    .andWhere('partida.estado = :estado', {
      estado: EstadoPartida.EN_CURSO,
    })
    .getRawMany<{ puestoId: string }>();

  const puestosOcupados = new Set(
    ocupados.map((partida) => partida.puestoId),
  );

  return puestos.map((puesto) => ({
    id: puesto.id,
    codigo: puesto.codigo,
    descripcion: puesto.descripcion,
    ocupado: puestosOcupados.has(puesto.id),
    videojuegos: (puesto.videojuegos ?? []).map((juego) => ({
      id: juego.id,
      nombre: juego.nombre,
      plataforma: juego.plataforma,
    })),
  }));
}


}
