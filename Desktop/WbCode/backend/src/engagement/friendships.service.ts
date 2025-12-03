import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendshipsService {
  constructor(private readonly prisma: PrismaService) {}

  listFriends(userId: number) {
    return this.prisma.friendship.findMany({
      where: { requester: userId },
      include: { addresseeUser: true }
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



