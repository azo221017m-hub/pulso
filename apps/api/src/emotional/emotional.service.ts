import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoSesionEmocional } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { FinalizeSessionDto } from './dto/finalize-session.dto';
import { ApplyInterventionDto } from './dto/apply-intervention.dto';

/// Mensaje fijo de corte de seguridad (spec §35) — nunca culpabilizante, nunca "diagnostica".
const MENSAJE_SEGURIDAD = 'Quiero que hagamos una pausa. Tu seguridad es lo más importante en este momento.';

@Injectable()
export class EmotionalService {
  constructor(private readonly prisma: PrismaService) {}

  listEmociones() {
    return this.prisma.emocion.findMany({
      where: { activo: true },
      orderBy: { orden: 'asc' },
    });
  }

  listIntervenciones() {
    return this.prisma.intervencion.findMany({
      where: { activo: true },
      orderBy: { nivelMinimo: 'asc' },
    });
  }

  private async nivelParaIntensidad(intensidad: number) {
    return this.prisma.nivelEmocional.findFirst({
      where: { intensidadMinima: { lte: intensidad }, intensidadMaxima: { gte: intensidad } },
    });
  }

  private async primeraPregunta(emocionId: string) {
    return this.prisma.preguntaEmocional.findFirst({
      where: { emocionId, activo: true },
      orderBy: { nivel: 'asc' },
      include: { respuestas: { where: { activo: true }, orderBy: { orden: 'asc' } } },
    });
  }

  private async recomendarIntervencion(intensidad: number) {
    const nivel = await this.nivelParaIntensidad(intensidad);
    const nivelNum = nivel?.nivel ?? 2;
    return this.prisma.intervencion.findFirst({
      where: { activo: true, nivelMinimo: { lte: nivelNum }, nivelMaximo: { gte: nivelNum } },
      orderBy: { nivelMinimo: 'desc' },
    });
  }

  async startSession(userId: string, dto: StartSessionDto) {
    const emocion = await this.prisma.emocion.findUnique({ where: { id: dto.emocionInicialId } });
    if (!emocion) throw new NotFoundException('Emoción no encontrada.');

    const sesion = await this.prisma.sesionEmocional.create({
      data: {
        userId,
        emocionInicialId: dto.emocionInicialId,
        intensidadInicial: dto.intensidadInicial,
      },
    });

    const pregunta = await this.primeraPregunta(dto.emocionInicialId);

    if (!pregunta) {
      const intervencionRecomendada = await this.recomendarIntervencion(dto.intensidadInicial);
      return { sesion, pregunta: null, done: true, seguridad: false, intervencionRecomendada };
    }

    return { sesion, pregunta, done: false, seguridad: false };
  }

  private async getOwnedSession(userId: string, sesionId: string) {
    const sesion = await this.prisma.sesionEmocional.findUnique({ where: { id: sesionId } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada.');
    if (sesion.userId !== userId) throw new ForbiddenException();
    return sesion;
  }

  async submitAnswer(userId: string, sesionId: string, dto: SubmitAnswerDto) {
    const sesion = await this.getOwnedSession(userId, sesionId);

    const respuesta = await this.prisma.respuestaEmocional.findUnique({
      where: { id: dto.respuestaId },
    });
    if (!respuesta || respuesta.preguntaId !== dto.preguntaId) {
      throw new NotFoundException('Respuesta no encontrada.');
    }

    await this.prisma.respuestaSesion.create({
      data: { sesionId, preguntaId: dto.preguntaId, respuestaId: dto.respuestaId },
    });

    if (respuesta.nivelRiesgo === 'CRITICO') {
      await this.prisma.sesionEmocional.update({
        where: { id: sesionId },
        data: {
          banderaSeguridad: true,
          estado: EstadoSesionEmocional.ABANDONADA,
          fechaFin: new Date(),
        },
      });
      return { seguridad: true, mensaje: MENSAJE_SEGURIDAD, pregunta: null, done: true };
    }

    if (respuesta.siguientePreguntaId) {
      const siguiente = await this.prisma.preguntaEmocional.findUnique({
        where: { id: respuesta.siguientePreguntaId },
        include: { respuestas: { where: { activo: true }, orderBy: { orden: 'asc' } } },
      });
      return { seguridad: false, pregunta: siguiente, done: false };
    }

    const intervencionRecomendada = await this.recomendarIntervencion(sesion.intensidadInicial);
    return { seguridad: false, pregunta: null, done: true, intervencionRecomendada };
  }

  async finalizeSession(userId: string, sesionId: string, dto: FinalizeSessionDto) {
    const sesion = await this.getOwnedSession(userId, sesionId);

    const nivel = await this.nivelParaIntensidad(dto.intensidadFinal);

    const updated = await this.prisma.sesionEmocional.update({
      where: { id: sesionId },
      data: {
        intensidadFinal: dto.intensidadFinal,
        emocionFinalId: dto.emocionFinalId ?? sesion.emocionInicialId,
        nivelFinal: nivel?.nivel,
        estado: EstadoSesionEmocional.COMPLETADA,
        fechaFin: new Date(),
      },
    });

    await this.recomputeRegistroDiario(userId, sesion.fechaInicio);
    return updated;
  }

  async applyIntervention(userId: string, sesionId: string, dto: ApplyInterventionDto) {
    await this.getOwnedSession(userId, sesionId);
    return this.prisma.aplicacionIntervencion.create({
      data: {
        sesionId,
        intervencionId: dto.intervencionId,
        intensidadAntes: dto.intensidadAntes,
        intensidadDespues: dto.intensidadDespues,
        resultado: dto.resultado,
      },
    });
  }

  private async recomputeRegistroDiario(userId: string, fechaReferencia: Date) {
    const inicioDia = new Date(fechaReferencia);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(inicioDia);
    finDia.setDate(finDia.getDate() + 1);

    const sesiones = await this.prisma.sesionEmocional.findMany({
      where: { userId, fechaInicio: { gte: inicioDia, lt: finDia } },
    });
    if (sesiones.length === 0) return;

    const intensidades = sesiones.map((s) => s.intensidadFinal ?? s.intensidadInicial);
    const intensidadMaxima = Math.max(...intensidades);
    const intensidadPromedio = intensidades.reduce((a, b) => a + b, 0) / intensidades.length;

    const conteoEmociones = new Map<string, number>();
    for (const s of sesiones) {
      const emocionId = s.emocionFinalId ?? s.emocionInicialId;
      conteoEmociones.set(emocionId, (conteoEmociones.get(emocionId) ?? 0) + 1);
    }
    const emocionPredominanteId = [...conteoEmociones.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    const nivel = await this.nivelParaIntensidad(intensidadMaxima);

    await this.prisma.registroEmocionalDiario.upsert({
      where: { userId_fecha: { userId, fecha: inicioDia } },
      create: {
        userId,
        fecha: inicioDia,
        emocionPredominanteId,
        color: nivel?.color,
        intensidadMaxima,
        intensidadPromedio,
        cantidadEventos: sesiones.length,
      },
      update: {
        emocionPredominanteId,
        color: nivel?.color,
        intensidadMaxima,
        intensidadPromedio,
        cantidadEventos: sesiones.length,
      },
    });
  }

  async getEvolucion(userId: string, rango: 'dia' | 'semana') {
    const dias = rango === 'semana' ? 7 : 1;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const desde = new Date(hoy);
    desde.setDate(desde.getDate() - (dias - 1));

    const registros = await this.prisma.registroEmocionalDiario.findMany({
      where: { userId, fecha: { gte: desde, lte: hoy } },
      include: { emocionPredominante: true },
      orderBy: { fecha: 'asc' },
    });

    const registroByFecha = new Map(registros.map((r) => [r.fecha.toISOString().slice(0, 10), r]));

    const timeline: Array<{
      fecha: string;
      conDatos: boolean;
      color: string | null;
      intensidadMaxima: number;
      intensidadPromedio: number;
      cantidadEventos: number;
      emocionPredominante: { nombre: string; icono: string } | null;
    }> = [];
    for (let i = 0; i < dias; i++) {
      const fecha = new Date(desde);
      fecha.setDate(fecha.getDate() + i);
      const key = fecha.toISOString().slice(0, 10);
      const registro = registroByFecha.get(key);
      timeline.push(
        registro
          ? {
              fecha: key,
              conDatos: true,
              color: registro.color,
              intensidadMaxima: registro.intensidadMaxima,
              intensidadPromedio: registro.intensidadPromedio,
              cantidadEventos: registro.cantidadEventos,
              emocionPredominante: registro.emocionPredominante
                ? { nombre: registro.emocionPredominante.nombre, icono: registro.emocionPredominante.icono }
                : null,
            }
          : { fecha: key, conDatos: false, color: null, intensidadMaxima: 0, intensidadPromedio: 0, cantidadEventos: 0, emocionPredominante: null },
      );
    }

    return { rango, timeline, hoy: timeline[timeline.length - 1] };
  }
}
