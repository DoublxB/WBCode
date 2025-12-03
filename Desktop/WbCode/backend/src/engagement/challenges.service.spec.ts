import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CodingService } from '../learning/coding.service';

describe('ChallengesService', () => {
  let service: ChallengesService;
  let prisma: jest.Mocked<PrismaService>;
  let gamification: jest.Mocked<GamificationService>;
  let coding: jest.Mocked<CodingService>;

  const mockChallenge = {
    id: 1,
    challengerId: 1,
    opponentId: 2,
    codingExerciseId: 1,
    status: 'PENDING',
    challengerScore: 100,
    opponentScore: 0,
    bonusXP: 0
  };

  beforeEach(async () => {
    const mockPrisma = {
      challenge: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockChallenge),
        update: jest.fn().mockResolvedValue(mockChallenge)
      },
      submission: {
        findFirst: jest.fn().mockResolvedValue(null)
      }
    } as unknown as PrismaService;

    const mockGamification = {
      awardXP: jest.fn().mockResolvedValue(undefined)
    } as any;

    const mockCoding = {
      submit: jest.fn().mockResolvedValue({ success: true, score: 100 })
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        ChallengesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GamificationService, useValue: mockGamification },
        { provide: CodingService, useValue: mockCoding }
      ]
    }).compile();

    service = module.get(ChallengesService);
    prisma = module.get(PrismaService) as any;
    gamification = module.get(GamificationService) as any;
    coding = module.get(CodingService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listChallenges', () => {
    it('should return challenges for user', async () => {
      const challenges = [mockChallenge];
      (prisma.challenge.findMany as any).mockResolvedValue(challenges as any);

      const result = await service.listChallenges(1);

      expect(prisma.challenge.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ challengerId: 1 }, { opponentId: 1 }]
        },
        include: { codingExercise: true, challenger: true, opponent: true }
      });
      expect(result).toEqual(challenges);
    });
  });

  describe('createChallenge', () => {
    it('should create challenge if user solved exercise', async () => {
      const input = { opponentId: 2, codingExerciseId: 1 };
      const mockSubmission = { id: 1, userId: 1, codingId: 1, score: 100 };

      (prisma.submission.findFirst as any).mockResolvedValue(mockSubmission as any);
      (prisma.challenge.create as any).mockResolvedValue(mockChallenge as any);

      const result = await service.createChallenge(1, input);

      expect(prisma.submission.findFirst).toHaveBeenCalled();
      expect(prisma.challenge.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if user did not solve exercise', async () => {
      const input = { opponentId: 2, codingExerciseId: 1 };

      (prisma.submission.findFirst as any).mockResolvedValue(null);

      await expect(service.createChallenge(1, input)).rejects.toThrow(ForbiddenException);
      expect(prisma.challenge.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if challenging self', async () => {
      const input = { opponentId: 1, codingExerciseId: 1 };

      await expect(service.createChallenge(1, input)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('acceptChallenge', () => {
    it('should accept challenge if user is opponent', async () => {
      (prisma.challenge.findUnique as any).mockResolvedValue(mockChallenge as any);
      (prisma.challenge.update as any).mockResolvedValue({ ...mockChallenge, status: 'ACCEPTED' } as any);

      const result = await service.acceptChallenge(2, 1);

      expect(prisma.challenge.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'ACCEPTED' }
      });
      expect(result.status).toBe('ACCEPTED');
    });

    it('should throw ForbiddenException if user is not opponent', async () => {
      (prisma.challenge.findUnique as any).mockResolvedValue(mockChallenge as any);

      await expect(service.acceptChallenge(999, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('submitChallengeCode', () => {
    it('should award bonus XP if opponent wins', async () => {
      const dto = { sourceCode: 'code', stdin: '' };
      (prisma.challenge.findUnique as any).mockResolvedValue(mockChallenge as any);
      coding.submit.mockResolvedValue({ success: true, score: 100 } as any);
      (prisma.challenge.update as any).mockResolvedValue(mockChallenge as any);
      (gamification.awardXP as any).mockResolvedValue(undefined);

      const result = await service.submitChallengeCode(2, 1, dto);

      expect(coding.submit).toHaveBeenCalled();
      expect(gamification.awardXP).toHaveBeenCalledWith(1, 40, 'Challenge victory bonus');
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if user is not part of challenge', async () => {
      const dto = { sourceCode: 'code', stdin: '' };
      (prisma.challenge.findUnique as any).mockResolvedValue(mockChallenge as any);

      await expect(service.submitChallengeCode(999, 1, dto)).rejects.toThrow(ForbiddenException);
    });
  });
});

