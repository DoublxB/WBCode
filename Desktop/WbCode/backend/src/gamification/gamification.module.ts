import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { GamificationScheduler } from './gamification.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { WBCCoinsService } from './wbc-coins.service';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';
import { CosmeticsController } from './cosmetics.controller';
import { CosmeticsService } from './cosmetics.service';

@Module({
  imports: [PrismaModule, AnalyticsModule],
  providers: [GamificationService, GamificationScheduler, WBCCoinsService, BadgesService, CosmeticsService],
  controllers: [GamificationController, BadgesController, CosmeticsController],
  exports: [GamificationService, WBCCoinsService, BadgesService, CosmeticsService]
})
export class GamificationModule {}



