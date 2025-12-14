import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendshipsService {
  constructor(private readonly prisma: PrismaService) {}

  listFriends(userId: number) {
    return this.prisma.friendship.findMany({
      where: {
        OR: [
          { requester: userId, status: 'accepted' },
          { addressee: userId, status: 'accepted' }
        ]
      },
      include: {
        requesterUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            xp: true,
            level: true
          }
        },
        addresseeUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            xp: true,
            level: true
          }
        }
      }
    });
  }

  async addFriend(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new Error('Cannot add yourself as friend');
    }
    return this.prisma.friendship.upsert({
      where: {
        requester_addressee: {
          requester: userId,
          addressee: friendId
        }
      },
      create: {
        requester: userId,
        addressee: friendId
      },
      update: {
        status: 'accepted'
      }
    });
  }
}












