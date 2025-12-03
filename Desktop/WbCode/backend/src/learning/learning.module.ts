import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { CodingService } from './coding.service';
import { CodingController } from './coding.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { SandboxModule } from '../sandbox/sandbox.module';

@Module({
  imports: [PrismaModule, GamificationModule, SandboxModule],
  controllers: [LessonsController, QuizzesController, CodingController],
  providers: [LessonsService, QuizzesService, CodingService],
  exports: [LessonsService, QuizzesService, CodingService]
})
export class LearningModule {}



