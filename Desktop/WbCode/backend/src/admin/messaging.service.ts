import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureAdminOrProfessor(user: { role: Role }) {
    if (user.role !== Role.ADMIN && user.role !== Role.PROFESSOR) {
      throw new ForbiddenException('Only admins and professors can send messages');
    }
  }

  async sendMessage(sender: { id: number; role: Role }, receiverId: number, subject: string, content: string) {
    this.ensureAdminOrProfessor(sender);
    
    // Ensure receiver exists
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Only admins can message professors and vice versa
    const receiverRole = await this.prisma.role.findUnique({ where: { id: receiver.roleId } });
    if (sender.role === Role.ADMIN && receiverRole?.name !== Role.PROFESSOR) {
      throw new ForbiddenException('Admins can only message professors');
    }
    if (sender.role === Role.PROFESSOR && receiverRole?.name !== Role.ADMIN) {
      throw new ForbiddenException('Professors can only message admins');
    }

    return this.prisma.message.create({
      data: {
        senderId: sender.id,
        receiverId,
        subject,
        content,
        status: 'SENT',
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: { select: { name: true } }
          }
        },
        receiver: {
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

  async getMessages(user: { id: number; role: Role }) {
    this.ensureAdminOrProfessor(user);
    
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: { select: { name: true } }
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return messages.map(msg => ({
      ...msg,
      sender: { ...msg.sender, role: msg.sender.role.name },
      receiver: { ...msg.receiver, role: msg.receiver.role.name }
    }));
  }

  async markAsRead(user: { id: number }, messageId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.receiverId !== user.id) {
      throw new ForbiddenException('You can only mark your own received messages as read');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
        status: 'READ'
      }
    });
  }

  async getUnreadCount(user: { id: number; role: Role }) {
    this.ensureAdminOrProfessor(user);
    
    return this.prisma.message.count({
      where: {
        receiverId: user.id,
        isRead: false
      }
    });
  }
}










