import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { WBCCoinsService } from '../gamification/wbc-coins.service';

type WeeklyMissionForProgress = {
  id: number;
  title: string;
  goalType: string;
  goalValue: number;
  rewardXP: number;
};

/**
 * Core mission progress handler used by both the MissionsService (manual progress)
 * and by other services (coding/quizzes) for automatic progress.
 */
export async function applyMissionProgress(
  prisma: PrismaService,
  gamification: GamificationService,
  userId: number,
  mission: WeeklyMissionForProgress,
  increment: number,
  wbcCoins?: WBCCoinsService
) {
  if (increment <= 0) {
    return;
  }

  const missionId = mission.id;

  const existing = await prisma.missionParticipant.findUnique({
    where: { missionId_userId: { missionId, userId } }
  });

  const newProgress = Math.min((existing?.progress ?? 0) + increment, mission.goalValue);

  const participant = existing
    ? await prisma.missionParticipant.update({
        where: { missionId_userId: { missionId, userId } },
        data: { progress: newProgress }
      })
    : await prisma.missionParticipant.create({
        data: { missionId, userId, progress: newProgress }
      });

  if (!participant.completed && newProgress >= mission.goalValue) {
    await prisma.missionParticipant.update({
      where: { missionId_userId: { missionId, userId } },
      data: { completed: true, completedAt: new Date(), progress: mission.goalValue }
    });
  }
}


