import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgesService } from '../gamification/badges.service';

@Injectable()
export class FriendshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badges: BadgesService
  ) {}

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
    const friendship = await this.prisma.friendship.upsert({
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

    // SOCIAL badges (friend count). Feature exists -> implement full logic.
    const countFriends = async (uid: number) => {
      const rows = await this.prisma.friendship.findMany({
        where: {
          OR: [
            { requester: uid, status: 'accepted' },
            { addressee: uid, status: 'accepted' }
          ]
        },
        select: { id: true }
      });
      return rows.length;
    };

    const userCount = await countFriends(userId);
    const friendCount = await countFriends(friendId);
    await this.badges.checkFriendsCount(userId, userCount);
    await this.badges.checkFriendsCount(friendId, friendCount);

    return friendship;
  }
}












