import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ActivateTsq8Dto } from './dto/activate-tsq8.dto';

/// Texto exacto requerido por el spec §7 — no debe modificarse sin autorización.
const MENSAJE_TSQ8 = 'hola, crees que alguién pueda escucharme 3 minutos, por favor. me es urgente. gracias.';

@Injectable()
export class Tsq8Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async activate(userId: string, dto: ActivateTsq8Dto) {
    if (dto.sesionId) {
      const sesion = await this.prisma.sesionEmocional.findUnique({ where: { id: dto.sesionId } });
      if (!sesion) throw new NotFoundException('Sesión no encontrada.');
      if (sesion.userId !== userId) throw new ForbiddenException();
    }

    const ubicacionEnviada = dto.latitud !== undefined && dto.longitud !== undefined;
    const textoMensaje = ubicacionEnviada
      ? `${MENSAJE_TSQ8}\n\nMi ubicación: https://maps.google.com/?q=${dto.latitud},${dto.longitud}`
      : MENSAJE_TSQ8;

    const evento = await this.prisma.tsq8Event.create({
      data: {
        userId,
        sesionId: dto.sesionId,
        latitud: dto.latitud,
        longitud: dto.longitud,
        mensaje: textoMensaje,
        estadoEnvio: 'ENLACE_GENERADO',
        fechaEnvio: new Date(),
      },
    });

    const destino = (this.config.get<string>('TSQ8_DESTINATION_PHONE') ?? '').replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/${destino}?text=${encodeURIComponent(textoMensaje)}`;

    return { id: evento.id, whatsappUrl, ubicacionEnviada };
  }
}
