import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, badges: { include: { badge: true } } }
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Transform role object to string for frontend
    return {
      ...user,
      role: user.role.name
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: dto.avatarUrl,
        title: dto.title
      }
    });
    return updated;
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      include: { role: true }
    });
    // Transform role object to string for frontend
    return users.map(user => ({
      ...user,
      role: user.role.name
    }));
  }
}



