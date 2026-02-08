import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendshipsController {
  constructor(private readonly friendships: FriendshipsService) {}

  @Get()
  list(@CurrentUser('sub') userId: number) {
    return this.friendships.listFriends(userId);
  }

  @Post(':friendId')
  addFriend(@CurrentUser('sub') userId: number, @Param('friendId', ParseIntPipe) friendId: number) {
    return this.friendships.addFriend(userId, friendId);
  }
}



















