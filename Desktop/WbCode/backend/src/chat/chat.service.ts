import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(user: { id: number; role: Role }) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                    role: { select: { name: true } }
                  }
                }
              }
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true
                  }
                }
              }
            },
            _count: {
              select: {
                messages: true
              }
            }
          }
        }
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc'
        }
      } as any
    });

    return participations.map(p => {
      const otherParticipants = p.conversation.participants
        .filter(part => part.userId !== user.id)
        .map(part => part.user);

      return {
        id: p.conversation.id,
        type: p.conversation.type,
        name: p.conversation.name || this.getConversationName(otherParticipants, user.role),
        participants: p.conversation.participants.map(part => ({
          ...part.user,
          role: part.user.role.name
        })),
        lastMessage: p.conversation.messages[0] || null,
        unreadCount: 0, // Will calculate separately
        updatedAt: p.conversation.updatedAt
      };
    });
  }

  async getConversation(conversationId: number, user: { id: number; role: Role }) {
    const participation = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversation_user: {
          conversationId,
          userId: user.id
        }
      }
    });

    if (!participation) {
      throw new NotFoundException('Conversation not found');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                role: { select: { name: true } }
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Mark messages as read
    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return {
      ...conversation,
      participants: conversation.participants.map(p => ({
        ...p.user,
        role: p.user.role.name
      }))
    };
  }

  async sendMessage(conversationId: number, sender: { id: number; role: Role }, content: string) {
    const participation = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversation_user: {
          conversationId,
          userId: sender.id
        }
      }
    });

    if (!participation) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: sender.id,
        content
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return message;
  }

  async createDirectConversation(user1: { id: number; role: Role }, user2Id: number) {
    // Check if conversation already exists - get all direct conversations and filter
    const allDirect = await this.prisma.conversation.findMany({
      where: { type: 'DIRECT' },
      include: { participants: true }
    });

    const existing = allDirect.find(conv => {
      const userIds = conv.participants.map(p => p.userId);
      return userIds.includes(user1.id) && userIds.includes(user2Id) && userIds.length === 2;
    });

    if (existing) {
      return this.prisma.conversation.findUnique({
        where: { id: existing.id },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                  role: { select: { name: true } }
                }
              }
            }
          }
        }
      });
    }

    return this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: [
            { userId: user1.id },
            { userId: user2Id }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                role: { select: { name: true } }
              }
            }
          }
        }
      }
    });
  }

  async createSupportConversation(user: { id: number; role: Role }) {
    if (user.role !== Role.PROFESSOR && user.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students and professors can create support conversations');
    }

    // Find an admin
    const admin = await this.prisma.user.findFirst({
      where: {
        role: { name: Role.ADMIN }
      }
    });

    if (!admin) {
      throw new NotFoundException('No admin available for support');
    }

    // Check if support conversation already exists
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'SUPPORT',
        participants: {
          some: { userId: user.id }
        }
      }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        type: 'SUPPORT',
        name: `Support - ${user.role}`,
        participants: {
          create: [
            { userId: user.id },
            { userId: admin.id }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                role: { select: { name: true } }
              }
            }
          }
        }
      }
    });
  }

  private getConversationName(participants: any[], userRole: Role): string {
    if (participants.length === 0) return 'You';
    if (participants.length === 1) {
      return `${participants[0].firstName} ${participants[0].lastName}`;
    }
    return `${participants.length} participants`;
  }
}

