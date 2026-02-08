import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BossService } from './boss.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('boss')
export class BossController {
  constructor(private readonly boss: BossService) {}

  @Get('completions/me')
  completions(@CurrentUser('sub') userId: number) {
    return this.boss.getMyCompletions(userId);
  }

  @Get('tests/:moduleSlug')
  getTest(@CurrentUser('sub') userId: number, @Param('moduleSlug') moduleSlug: string) {
    return this.boss.getBossTestDefinition(userId, moduleSlug);
  }

  @Post('tests/:moduleSlug/complete')
  complete(
    @CurrentUser('sub') userId: number,
    @Param('moduleSlug') moduleSlug: string,
    @Body() body: { passed?: boolean }
  ) {
    return this.boss.completeBoss(userId, moduleSlug, Boolean(body?.passed));
  }
}




