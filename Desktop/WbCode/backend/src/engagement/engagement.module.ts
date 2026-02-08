import { Module } from '@nestjs/common';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsService } from './friendships.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChallengesController } from './challenges.controller';
import { ChallengesService } from './challenges.service';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { GamificationModule } from '../gamification/gamification.module';
import { LearningModule } from '../learning/learning.module';
import { MissionsScheduler } from './missions.scheduler';

@Module({
  imports: [PrismaModule, GamificationModule, LearningModule],
  controllers: [FriendshipsController, ChallengesController, MissionsController],
  providers: [FriendshipsService, ChallengesService, MissionsService, MissionsScheduler]
})
export class EngagementModule {}



















