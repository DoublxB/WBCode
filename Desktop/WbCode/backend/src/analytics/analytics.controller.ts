import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { CreateActivityEventDto } from './dto/create-activity-event.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CreateReferralInviteDto } from './dto/create-referral-invite.dto';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('event')
  event(@CurrentUser('sub') userId: number, @Body() dto: CreateActivityEventDto) {
    return this.analytics.recordEvent(userId, dto as any);
  }

  @Post('invites')
  createInvite(@CurrentUser('sub') userId: number, @Body() dto: CreateReferralInviteDto) {
    return this.analytics.createInvite(userId, dto.inviteeEmail);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('metrics')
  metrics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.getMetrics({ from, to });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('gamification')
  gamification(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.getGamificationAnalytics({ from, to });
  }
}





