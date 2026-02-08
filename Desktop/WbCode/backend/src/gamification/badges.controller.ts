import { Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { BadgesService } from './badges.service';

@UseGuards(JwtAuthGuard)
@Controller('badges')
export class BadgesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badges: BadgesService
  ) {}

  @Get()
  async listAllBadges() {
    // Return all available badges for the collection grid
    return this.prisma.badge.findMany({
      orderBy: [{ threshold: 'asc' }, { id: 'asc' }]
    });
  }

  @Get('me')
  async myBadges(@CurrentUser('sub') userId: number) {
    // Return user's unlocked badges (assignments)
    return this.prisma.badgeAssignment.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' }
    });
  }

  @Get('unlocks')
  async myUnseenUnlocks(@CurrentUser('sub') userId: number) {
    return this.badges.listUnseenUnlocks(userId, 5);
  }

  @Post('unlocks/:id/seen')
  async markSeen(@CurrentUser('sub') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.badges.markUnlockSeen(userId, id);
  }
}


