import { Test } from '@nestjs/testing';
import { GamificationService } from './gamification.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GamificationService', () => {
  let service: GamificationService;
  const prisma = {
    user: {
      update: jest.fn().mockResolvedValue({ id: 1, xp: 150, level: 1 }),
      findUnique: jest.fn().mockResolvedValue({ id: 1, xp: 150, level: 1, badges: [] })
    },
    xPEvent: { create: jest.fn() },
    leaderboardEntry: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([{ id: 1, userId: 1, xp: 150 }]),
      update: jest.fn()
    },
    badge: { findMany: jest.fn().mockResolvedValue([]) },
    badgeAssignment: { create: jest.fn() }
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [GamificationService, { provide: PrismaService, useValue: prisma }]
    }).compile();
    service = module.get(GamificationService);
  });

  it('awards XP and refreshes leaderboard', async () => {
    await service.awardXP(1, 50, 'Test');
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.leaderboardEntry.upsert).toHaveBeenCalled();
  });
});












