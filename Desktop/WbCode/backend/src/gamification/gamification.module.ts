import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { GamificationScheduler } from './gamification.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GamificationService, GamificationScheduler],
  controllers: [GamificationController],
  exports: [GamificationService]
})
export class GamificationModule {}



