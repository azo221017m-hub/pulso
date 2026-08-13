import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        timezone: dto.timezone,
        quitMotivation: dto.quitMotivation,
        quitDate: dto.quitDate ? new Date(dto.quitDate) : undefined,
      },
    });
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }
}
