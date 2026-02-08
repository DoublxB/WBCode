import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { CodingService } from './coding.service';
import { CodingController } from './coding.controller';
import { BossController } from './boss.controller';
import { BossService } from './boss.service';
import { GamificationModule } from '../gamification/gamification.module';
import { SandboxModule } from '../sandbox/sandbox.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [PrismaModule, GamificationModule, SandboxModule, AnalyticsModule],
  controllers: [LessonsController, QuizzesController, CodingController, BossController],
  providers: [LessonsService, QuizzesService, CodingService, BossService],
  exports: [LessonsService, QuizzesService, CodingService, BossService]
})
export class LearningModule {}

















