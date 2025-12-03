import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMissionDto, MissionProgressDto } from './dto/create-mission.dto';
import { Role } from '../common/constants/roles';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService, private readonly gamification: GamificationService) {}

  listActiveMissions() {
    const now = new Date();
    return this.prisma.weeklyMission.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: { participants: true }
    });
  }

  async createMission(user: { id: number; role: Role }, dto: CreateMissionDto) {
    if (![Role.PROFESSOR, Role.ADMIN].includes(user.role)) {
      throw new ForbiddenException('Only professors can create missions');
    }
    return this.prisma.weeklyMission.create({
      data: {
        title: dto.title,
        description: dto.description,
        goalType: dto.goalType,
        goalValue: dto.goalValue,
        rewardXP: dto.rewardXP,
        status: 'ACTIVE',
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        creatorId: user.id
      }
    });
  }

  async joinMission(userId: number, missionId: number) {
    await this.prisma.weeklyMission.findUniqueOrThrow({ where: { id: missionId } });
    return this.prisma.missionParticipant.upsert({
      where: { missionId_userId: { missionId, userId } },
      create: { missionId, userId },
      update: {}
    });
  }

  async submitProgress(userId: number, missionId: number, dto: MissionProgressDto) {
    const mission = await this.prisma.weeklyMission.findUnique({
      where: { id: missionId },
      include: { participants: true }
    });
    if (!mission) throw new NotFoundException('Mission not found');

    const existing = await this.prisma.missionParticipant.findUnique({
      where: { missionId_userId: { missionId, userId } }
    });
    const newProgress = Math.min((existing?.progress ?? 0) + dto.progress, mission.goalValue);

    const participant = existing
      ? await this.prisma.missionParticipant.update({
          where: { missionId_userId: { missionId, userId } },
          data: { progress: newProgress }
        })
      : await this.prisma.missionParticipant.create({
          data: { missionId, userId, progress: newProgress }
        });

    if (!participant.completed && newProgress >= mission.goalValue) {
      await this.prisma.missionParticipant.update({
        where: { missionId_userId: { missionId, userId } },
        data: { completed: true, progress: mission.goalValue }
      });
      await this.gamification.awardXP(userId, mission.rewardXP, `Mission: ${mission.title}`);
    }
    return this.prisma.missionParticipant.findUnique({
      where: { missionId_userId: { missionId, userId } }
    });
  }

  async closeExpiredMissions() {
    const now = new Date();
    await this.prisma.weeklyMission.updateMany({
      where: { endDate: { lt: now }, status: 'ACTIVE' },
      data: { status: 'COMPLETED' }
    });
  }
}

