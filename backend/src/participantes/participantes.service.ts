import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsuarioAutenticado } from '../autenticacion/dominio/usuario-autenticado.interface';
import { RolUsuario } from '../usuarios/dominio/rol-usuario.enum';
import { EventoEntity } from '../eventos/dominio/evento.entity';
import { EstadoEvento } from '../eventos/dominio/estado-evento.enum';
import { UsuarioEntity } from '../usuarios/dominio/usuario.entity';
import { ParticipanteEntity } from './dominio/participante.entity';
import { EstadoParticipante } from './dominio/estado-participante.enum';

/** Gestiona la inscripción de cuentas en cada edición. */
@Injectable()
export class ParticipantesService {
  constructor(
    private readonly fuenteDatos: DataSource,
    @InjectRepository(ParticipanteEntity) private readonly participantes: Repository<ParticipanteEntity>,
    @InjectRepository(EventoEntity) private readonly eventos: Repository<EventoEntity>,
  ) {}

  async inscribir(eventoId: string, usuarioId: string, actor?: UsuarioAutenticado): Promise<ParticipanteEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      if (actor) this.autorizar(evento, actor);
      if (evento.estado !== EstadoEvento.BORRADOR && evento.estado !== EstadoEvento.EN_CURSO) throw new BadRequestException('La edición no admite nuevas inscripciones');
      if (evento.estado === EstadoEvento.EN_CURSO && Date.now() >= evento.fechaCierreEnfrentamientos.getTime()) throw new BadRequestException('Ha terminado el plazo de inscripción');
      const usuario = await gestor.getRepository(UsuarioEntity).findOne({ where: { id: usuarioId, activo: true } });
      if (!usuario) throw new NotFoundException('No se ha encontrado una cuenta activa con ese identificador');
      const repo = gestor.getRepository(ParticipanteEntity);
      const anterior = await repo.findOne({ where: { eventoId, usuarioId } });
      if (anterior) {
        if (anterior.estado === EstadoParticipante.INSCRITO) throw new ConflictException('La cuenta ya está inscrita en esta edición');
        anterior.estado = EstadoParticipante.INSCRITO;
        return repo.save(anterior);
      }
      return repo.save(repo.create({ eventoId, usuarioId, estado: EstadoParticipante.INSCRITO, saldoApuchiCoins: 0 }));
    });
  }

  async inscribirPorAnfitrion(eventoId: string, usuarioId: string, actor: UsuarioAutenticado): Promise<ParticipanteEntity> {
    return this.inscribir(eventoId, usuarioId, actor);
  }

  async listar(eventoId: string, actor: UsuarioAutenticado): Promise<ParticipanteEntity[]> {
    await this.autorizarEdicion(eventoId, actor);
    const evento = await this.eventos.findOne({ where: { id: eventoId } });
    if (!evento) throw new NotFoundException('No se ha encontrado la edición');
    return this.participantes.find({
      where: { eventoId, estado: EstadoParticipante.INSCRITO },
      relations: { usuario: true },
      order: { inscritoEn: 'ASC' },
    });
  }

  async retirar(eventoId: string, participanteId: string, actor: UsuarioAutenticado): Promise<ParticipanteEntity> {
    return this.fuenteDatos.transaction(async (gestor) => {
      const evento = await gestor.getRepository(EventoEntity).findOne({ where: { id: eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!evento) throw new NotFoundException('No se ha encontrado la edición');
      this.autorizar(evento, actor);
      if (![EstadoEvento.BORRADOR, EstadoEvento.EN_CURSO, EstadoEvento.PERIODO_ADICIONAL].includes(evento.estado)) {
        throw new BadRequestException('No se puede modificar una inscripción en una edición finalizada');
      }
      const repo = gestor.getRepository(ParticipanteEntity);
      const participante = await repo.findOne({ where: { id: participanteId, eventoId }, lock: { mode: 'pessimistic_write' } });
      if (!participante) throw new NotFoundException('No se ha encontrado la inscripción');
      if (participante.estado !== EstadoParticipante.INSCRITO) throw new BadRequestException('La inscripción ya está retirada');
      const partidaActiva = await gestor.query('SELECT 1 FROM "partidas_jugadores_activos" WHERE "participante_id" = $1 LIMIT 1', [participanteId]);
      if (partidaActiva.length) throw new ConflictException('No puedes retirar a un participante que tiene una partida en curso');
      participante.estado = EstadoParticipante.RETIRADO;
      return repo.save(participante);
    });
  }

  private autorizar(evento: EventoEntity, actor: UsuarioAutenticado): void {
    if (actor.rol !== RolUsuario.ADMINISTRADOR && evento.anfitrionId !== actor.id) {
      throw new ForbiddenException('Solo el anfitrión responsable o un administrador puede gestionar las inscripciones');
    }
  }
}
