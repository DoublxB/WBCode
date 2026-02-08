import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

@Injectable()
export class AssignmentApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureAdmin(user: { role: Role }) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin privileges required');
    }
  }

  async listPendingAssignments(admin: { role: Role }) {
    this.ensureAdmin(admin);

    return this.prisma.classAssignment.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async reviewAssignment(
    admin: { id: number; role: Role },
    assignmentId: number,
    status: 'APPROVED' | 'REJECTED',
    adminNotes?: string
  ) {
    this.ensureAdmin(admin);

    const assignment = await this.prisma.classAssignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.status !== 'PENDING_APPROVAL') {
      throw new ForbiddenException('Assignment is not pending approval');
    }

    const updateData: any = {
      status: status === 'APPROVED' ? 'PUBLISHED' : 'REJECTED',
      adminId: admin.id,
      adminNotes,
      approvedAt: status === 'APPROVED' ? new Date() : null
    };

    return this.prisma.classAssignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: {
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }
}

















