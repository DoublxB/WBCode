import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LearningModule } from './learning/learning.module';
import { GamificationModule } from './gamification/gamification.module';
import { EngagementModule } from './engagement/engagement.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { ProfessorModule } from './professor/professor.module';
import { AdminModule } from './admin/admin.module';
import { SandboxModule } from './sandbox/sandbox.module';
import { ChatModule } from './chat/chat.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      expandVariables: true
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100 // 100 requests per minute
      }
    ]),
    PrismaModule,
    SandboxModule,
    AuthModule,
    UsersModule,
    LearningModule,
    GamificationModule,
    EngagementModule,
    SubmissionsModule,
    ProfessorModule,
    AdminModule,
    ChatModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}

