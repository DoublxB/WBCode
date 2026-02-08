import { Controller, Get, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';

@Controller('leaderboard')
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  @Get()
  getLeaderboard(@Query('limit') limit?: string) {
    return this.gamification.getLeaderboard(limit ? Number(limit) : 50);
  }

  @Get('period')
  getPeriodInfo() {
    return this.gamification.getPeriodInfo();
  }
}















