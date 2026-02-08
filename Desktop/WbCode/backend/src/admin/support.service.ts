import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async createTicket(
    user: { id: number },
    subject: string,
    description: string,
    category: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'
  ) {
    return this.prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject,
        description,
        category,
        priority,
        status: 'OPEN'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: { select: { name: true } }
          }
        }
      }
    });
  }

  async listTickets(requester: { id: number; role: Role }) {
    if (requester.role === Role.ADMIN) {
      // Admin sees all tickets
      return this.prisma.supportTicket.findMany({
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: { select: { name: true } }
            }
          },
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: { select: { name: true } }
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    } else {
      // Users see only their tickets
      return this.prisma.supportTicket.findMany({
        where: { userId: requester.id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: { select: { name: true } }
            }
          },
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: { select: { name: true } }
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  async assignTicket(admin: { id: number; role: Role }, ticketId: number) {
    if (admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can assign tickets');
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        adminId: admin.id,
        status: 'IN_PROGRESS'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: { select: { name: true } }
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

  async addReply(
    user: { id: number; role: Role },
    ticketId: number,
    content: string,
    isInternal: boolean = false
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Only admins can add internal notes
    if (isInternal && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can add internal notes');
    }

    // Users can only reply to their own tickets
    if (!isInternal && ticket.userId !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only reply to your own tickets');
    }

    // If admin replies, update ticket status
    if (user.role === Role.ADMIN && !isInternal) {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' }
      });
    }

    return this.prisma.supportTicketReply.create({
      data: {
        ticketId,
        userId: user.id,
        content,
        isInternal
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: { select: { name: true } }
          }
        }
      }
    });
  }

  async resolveTicket(admin: { id: number; role: Role }, ticketId: number, resolution: string) {
    if (admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can resolve tickets');
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: { select: { name: true } }
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

  async updateTicketStatus(
    admin: { id: number; role: Role },
    ticketId: number,
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  ) {
    if (admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can update ticket status');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status }
    });
  }
}

















