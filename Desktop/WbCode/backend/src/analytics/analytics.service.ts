import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityEventType } from '@prisma/client';
import { randomBytes } from 'crypto';

const DAY_MS = 24 * 60 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function parseDateParam(value?: string, fallback: Date = new Date(0)) {
  if (!value) return fallback;
  const d = new Date(value);
  return isNaN(d.getTime()) ? fallback : d;
}

function toDayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(params?: { from?: string; to?: string }, fallbackDays = 30) {
    const to = parseDateParam(params?.to, new Date());
    const from = parseDateParam(params?.from, new Date(to.getTime() - fallbackDays * DAY_MS));
    return { from, to };
  }

  async recordEvent(userId: number, payload: { type: ActivityEventType; codingId?: number; quizId?: number; missionId?: number; metadata?: any }) {
    return this.prisma.activityEvent.create({
      data: {
        userId,
        type: payload.type,
        codingId: payload.codingId,
        quizId: payload.quizId,
        missionId: payload.missionId,
        metadata: payload.metadata ?? undefined
      }
    });
  }

  async createInvite(inviterId: number, inviteeEmail?: string) {
    const code = randomBytes(6).toString('hex'); // 12 chars, good enough
    const invite = await this.prisma.referralInvite.create({
      data: {
        code,
        inviterId,
        inviteeEmail: inviteeEmail || null
      }
    });
    return invite;
  }

  async getMetrics(params: { from?: string; to?: string }) {
    const to = parseDateParam(params.to, new Date());
    const from = parseDateParam(params.from, new Date(to.getTime() - 24 * 60 * 60 * 1000));

    // DAU via explicit app-open events (fallback to submissions)
    const dauEvents = await this.prisma.activityEvent.findMany({
      where: { type: ActivityEventType.APP_OPEN, createdAt: { gte: from, lte: to } },
      select: { userId: true },
      distinct: ['userId']
    });

    const dauFallbackSubmissions = await this.prisma.submission.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { userId: true },
      distinct: ['userId']
    });

    const dau = dauEvents.length > 0 ? dauEvents.length : dauFallbackSubmissions.length;

    // Mission DAU: users who opened missions or claimed reward
    const missionUsers = await this.prisma.activityEvent.findMany({
      where: {
        type: { in: [ActivityEventType.MISSIONS_VIEW, ActivityEventType.MISSION_CLAIM] },
        createdAt: { gte: from, lte: to }
      },
      select: { userId: true },
      distinct: ['userId']
    });

    // Completion rate: among started CodeLab exercises, how many were solved
    const starts = await this.prisma.activityEvent.findMany({
      where: {
        type: ActivityEventType.CODELAB_START,
        codingId: { not: null },
        createdAt: { gte: from, lte: to }
      },
      select: { userId: true, codingId: true }
    });

    const startedKeys = new Set(starts.map((s) => `${s.userId}:${s.codingId}`));

    const solved = await this.prisma.submission.findMany({
      where: {
        type: 'CODING',
        score: { gt: 0 },
        codingId: { not: null },
        createdAt: { gte: from, lte: to }
      },
      select: { userId: true, codingId: true },
      distinct: ['userId', 'codingId']
    });
    const solvedKeys = new Set(solved.map((s) => `${s.userId}:${s.codingId}`));

    let completed = 0;
    for (const k of startedKeys) {
      if (solvedKeys.has(k)) completed += 1;
    }
    const completionRate = startedKeys.size > 0 ? completed / startedKeys.size : 0;

    // Viral coefficient (simple): accepted invites per new user in period
    const acceptedInvites = await this.prisma.referralInvite.count({
      where: { acceptedAt: { gte: from, lte: to } }
    });
    const newUsers = await this.prisma.user.count({
      where: { createdAt: { gte: from, lte: to } }
    });
    const viralCoefficient = newUsers > 0 ? acceptedInvites / newUsers : 0;

    // Extra context (useful for dashboards)
    const invitesSent = await this.prisma.referralInvite.count({
      where: { createdAt: { gte: from, lte: to } }
    });
    const inviteConversion = invitesSent > 0 ? acceptedInvites / invitesSent : 0;

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      dau,
      missionDau: missionUsers.length,
      codelabStarts: startedKeys.size,
      codelabCompleted: completed,
      codelabCompletionRate: completionRate,
      invitesSent,
      invitesAccepted: acceptedInvites,
      newUsers,
      viralCoefficient,
      inviteConversion
    };
  }

  async getStreakResilience(params?: { from?: string; to?: string }) {
    const { from, to } = this.getDateRange(params, 30);
    const streakLostEvents = await this.prisma.activityEvent.findMany({
      where: { type: 'STREAK_LOST' as ActivityEventType, createdAt: { gte: from, lte: to } },
      select: { userId: true, createdAt: true }
    });

    const streakLostUsers = new Set(streakLostEvents.map((e) => e.userId));
    if (streakLostEvents.length === 0) {
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        streakLostUsers: 0,
        returnedWithin3Days: 0,
        resilienceRate: 0
      };
    }

    const activityTo = new Date(to.getTime() + 3 * DAY_MS);
    const appOpens = await this.prisma.activityEvent.findMany({
      where: { type: ActivityEventType.APP_OPEN, createdAt: { gte: from, lte: activityTo } },
      select: { userId: true, createdAt: true }
    });
    const submissions = await this.prisma.submission.findMany({
      where: { createdAt: { gte: from, lte: activityTo } },
      select: { userId: true, createdAt: true }
    });

    const activityByUser = new Map<number, number[]>();
    const pushActivity = (userId: number, ts: Date) => {
      if (!activityByUser.has(userId)) activityByUser.set(userId, []);
      activityByUser.get(userId)!.push(ts.getTime());
    };
    appOpens.forEach((e) => pushActivity(e.userId, e.createdAt));
    submissions.forEach((s) => pushActivity(s.userId, s.createdAt));
    activityByUser.forEach((times) => times.sort((a, b) => a - b));

    const returnedUsers = new Set<number>();
    for (const event of streakLostEvents) {
      if (returnedUsers.has(event.userId)) continue;
      const times = activityByUser.get(event.userId) || [];
      const windowStart = event.createdAt.getTime();
      const windowEnd = windowStart + 3 * DAY_MS;
      if (times.some((t) => t > windowStart && t <= windowEnd)) {
        returnedUsers.add(event.userId);
      }
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      streakLostUsers: streakLostUsers.size,
      returnedWithin3Days: returnedUsers.size,
      resilienceRate: streakLostUsers.size > 0 ? returnedUsers.size / streakLostUsers.size : 0
    };
  }

  async getDopamineEffect(params?: { from?: string; to?: string }) {
    const { from, to } = this.getDateRange(params, 30);
    const badgeUnlocks = await this.prisma.activityEvent.findMany({
      where: { type: 'BADGE_UNLOCK' as ActivityEventType, createdAt: { gte: from, lte: to } },
      select: { userId: true, createdAt: true }
    });

    if (badgeUnlocks.length === 0) {
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        badgeUnlocks: 0,
        unlockUsers: 0,
        usersWithSpike: 0,
        spikeRate: 0
      };
    }

    const activityTo = new Date(to.getTime() + FIFTEEN_MIN_MS);
    const submissions = await this.prisma.submission.findMany({
      where: {
        type: 'CODING',
        createdAt: { gte: from, lte: activityTo }
      },
      select: { userId: true, createdAt: true }
    });
    const lessonReads = await this.prisma.lessonRead.findMany({
      where: { readAt: { gte: from, lte: activityTo } },
      select: { userId: true, readAt: true }
    });

    const activityByUser = new Map<number, number[]>();
    const pushActivity = (userId: number, ts: Date) => {
      if (!activityByUser.has(userId)) activityByUser.set(userId, []);
      activityByUser.get(userId)!.push(ts.getTime());
    };
    submissions.forEach((s) => pushActivity(s.userId, s.createdAt));
    lessonReads.forEach((r) => pushActivity(r.userId, r.readAt));
    activityByUser.forEach((times) => times.sort((a, b) => a - b));

    const unlockUsers = new Set(badgeUnlocks.map((u) => u.userId));
    const usersWithSpike = new Set<number>();

    for (const unlock of badgeUnlocks) {
      if (usersWithSpike.has(unlock.userId)) continue;
      const times = activityByUser.get(unlock.userId) || [];
      const windowStart = unlock.createdAt.getTime();
      const windowEnd = windowStart + FIFTEEN_MIN_MS;
      if (times.some((t) => t > windowStart && t <= windowEnd)) {
        usersWithSpike.add(unlock.userId);
      }
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      badgeUnlocks: badgeUnlocks.length,
      unlockUsers: unlockUsers.size,
      usersWithSpike: usersWithSpike.size,
      spikeRate: unlockUsers.size > 0 ? usersWithSpike.size / unlockUsers.size : 0
    };
  }

  async getEconomyStats(params?: { from?: string; to?: string }) {
    const { from, to } = this.getDateRange(params, 30);

    const appOpens = await this.prisma.activityEvent.findMany({
      where: { type: ActivityEventType.APP_OPEN, createdAt: { gte: from, lte: to } },
      select: { userId: true, createdAt: true }
    });
    const submissions = await this.prisma.submission.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { userId: true, createdAt: true }
    });

    const dauByDay = new Map<string, Set<number>>();
    const addDau = (userId: number, ts: Date) => {
      const day = toDayKey(ts);
      if (!dauByDay.has(day)) dauByDay.set(day, new Set());
      dauByDay.get(day)!.add(userId);
    };
    appOpens.forEach((e) => addDau(e.userId, e.createdAt));
    submissions.forEach((s) => addDau(s.userId, s.createdAt));

    const dauDays = Array.from(dauByDay.values()).reduce((sum, set) => sum + set.size, 0);

    const coinEvents = await this.prisma.activityEvent.findMany({
      where: { type: 'COIN_TRANSACTION' as ActivityEventType, createdAt: { gte: from, lte: to } },
      select: { userId: true, createdAt: true, metadata: true }
    });

    let totalEarned = 0;
    let totalSpent = 0;
    for (const ev of coinEvents) {
      const meta: any = ev.metadata || {};
      const amount = Number(meta.amount || 0);
      const txType = String(meta.transactionType || '').toUpperCase();
      if (!Number.isFinite(amount) || amount <= 0) continue;
      if (txType === 'EARN') totalEarned += amount;
      if (txType === 'BURN') totalSpent += amount;
    }

    const avgEarnedPerDayPerDau = dauDays > 0 ? totalEarned / dauDays : 0;
    const avgSpentPerDayPerDau = dauDays > 0 ? totalSpent / dauDays : 0;

    const highBalanceUsers = await this.prisma.user.findMany({
      where: { wbcCoins: { gt: 1000 } },
      select: { id: true }
    });
    const highIds = highBalanceUsers.map((u) => u.id);
    let hoardingIndex = 0;
    let hoardingUsers = 0;

    if (highIds.length > 0) {
      const burnEvents = await this.prisma.activityEvent.findMany({
        where: { type: 'COIN_TRANSACTION' as ActivityEventType, userId: { in: highIds } },
        select: { userId: true, metadata: true }
      });

      const burnUsers = new Set<number>();
      for (const ev of burnEvents) {
        const meta: any = ev.metadata || {};
        const txType = String(meta.transactionType || '').toUpperCase();
        if (txType === 'BURN') burnUsers.add(ev.userId);
      }

      hoardingUsers = highIds.filter((id) => !burnUsers.has(id)).length;
      hoardingIndex = highIds.length > 0 ? hoardingUsers / highIds.length : 0;
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      averageCoinsEarnedPerDayPerDau: avgEarnedPerDayPerDau,
      averageCoinsSpentPerDayPerDau: avgSpentPerDayPerDau,
      hoardingIndex,
      highBalanceUsers: highIds.length,
      hoardingUsers,
      totalEarned,
      totalSpent,
      dauDays
    };
  }

  async getHintEfficiency(params?: { from?: string; to?: string }) {
    const { from, to } = this.getDateRange(params, 30);
    const purchases = await this.prisma.activityEvent.findMany({
      where: { type: 'HINT_PURCHASE' as ActivityEventType, createdAt: { gte: from, lte: to } },
      select: { userId: true, createdAt: true, codingId: true, metadata: true }
    });

    if (purchases.length === 0) {
      return {
        from: from.toISOString(),
        to: to.toISOString(),
        purchases: 0,
        conversions: 0,
        conversionRate: 0
      };
    }

    const activityTo = new Date(to.getTime() + HOUR_MS);
    const submissions = await this.prisma.submission.findMany({
      where: {
        type: 'CODING',
        score: 100,
        createdAt: { gte: from, lte: activityTo }
      },
      select: { userId: true, codingId: true, createdAt: true }
    });

    const submissionMap = new Map<string, number[]>();
    for (const sub of submissions) {
      if (!sub.codingId) continue;
      const key = `${sub.userId}:${sub.codingId}`;
      if (!submissionMap.has(key)) submissionMap.set(key, []);
      submissionMap.get(key)!.push(sub.createdAt.getTime());
    }
    submissionMap.forEach((times) => times.sort((a, b) => a - b));

    let conversions = 0;
    for (const purchase of purchases) {
      const exerciseId = purchase.codingId ?? (purchase.metadata as any)?.exerciseId;
      if (!exerciseId) continue;
      const key = `${purchase.userId}:${exerciseId}`;
      const times = submissionMap.get(key) || [];
      const windowStart = purchase.createdAt.getTime();
      const windowEnd = windowStart + HOUR_MS;
      if (times.some((t) => t > windowStart && t <= windowEnd)) {
        conversions += 1;
      }
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      purchases: purchases.length,
      conversions,
      conversionRate: purchases.length > 0 ? conversions / purchases.length : 0
    };
  }

  async getGamificationAnalytics(params?: { from?: string; to?: string }) {
    const [streakResilience, dopamineEffect, economyStats, hintEfficiency] = await Promise.all([
      this.getStreakResilience(params),
      this.getDopamineEffect(params),
      this.getEconomyStats(params),
      this.getHintEfficiency(params)
    ]);

    return {
      streakResilience,
      dopamineEffect,
      economyStats,
      hintEfficiency
    };
  }
}





