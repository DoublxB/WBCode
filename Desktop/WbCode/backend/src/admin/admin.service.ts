import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureAdmin(user: { role: Role }) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin privileges required');
    }
  }

  async listUsers(requester: { role: Role }) {
    this.ensureAdmin(requester);
    const users = await this.prisma.user.findMany({ include: { role: true } });
    // Transform role object to string for frontend
    return users.map(user => ({
      ...user,
      role: user.role.name
    }));
  }

  async updateUserRole(requester: { role: Role }, userId: number, role: Role) {
    this.ensureAdmin(requester);
    const targetRole = await this.prisma.role.findUnique({ where: { name: role } });
    if (!targetRole) throw new NotFoundException('Role not found');
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId: targetRole.id }
    });
  }
}



