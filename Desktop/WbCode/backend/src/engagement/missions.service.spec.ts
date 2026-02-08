import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { Role } from '../common/constants/roles';
import { MissionGoalType } from './dto/create-mission.dto';

describe('MissionsService', () => {
  let service: MissionsService;
  let prisma: jest.Mocked<PrismaService>;
  let gamification: jest.Mocked<GamificationService>;

  const mockMission = {
    id: 1,
    title: 'Test Mission',
    description: 'Test Description',
    goalType: 'QUIZZES',
    goalValue: 10,
    rewardXP: 100,
    status: 'ACTIVE',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    creatorId: 1
  };

  const mockProfessor = { id: 1, role: Role.PROFESSOR };
  const mockStudent = { id: 2, role: Role.STUDENT };

  beforeEach(async () => {
    const mockPrisma = {
      weeklyMission: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn().mockResolvedValue(mockMission),
        create: jest.fn().mockResolvedValue(mockMission),
        updateMany: jest.fn().mockResolvedValue({ count: 0 })
      },
      missionParticipant: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ missionId: 1, userId: 2, progress: 0, completed: false }),
        create: jest.fn().mockResolvedValue({ missionId: 1, userId: 2, progress: 0, completed: false }),
        update: jest.fn().mockResolvedValue({ missionId: 1, userId: 2, progress: 0, completed: false })
      }
    } as unknown as PrismaService;

    const mockGamification = {
      awardXP: jest.fn().mockResolvedValue(undefined)
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        MissionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GamificationService, useValue: mockGamification }
      ]
    }).compile();

    service = module.get(MissionsService);
    prisma = module.get(PrismaService) as any;
    gamification = module.get(GamificationService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listActiveMissions', () => {
    it('should return active missions', async () => {
      const missions = [mockMission];
      (prisma.weeklyMission.findMany as any).mockResolvedValue(missions as any);

      const result = await service.listActiveMissionsForUser(1);

      expect(prisma.weeklyMission.findMany).toHaveBeenCalled();
      expect(result).toEqual(missions);
    });
  });

  describe('createMission', () => {
    it('should create mission as professor', async () => {
      const dto = {
        title: 'New Mission',
        description: 'Description',
        goalType: MissionGoalType.QUIZZES,
        goalValue: 5,
        rewardXP: 50,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      (prisma.weeklyMission.create as any).mockResolvedValue(mockMission as any);

      const result = await service.createMission(mockProfessor, dto);

      expect(prisma.weeklyMission.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if student tries to create', async () => {
      const dto = {
        title: 'Mission',
        description: 'Description',
        goalType: MissionGoalType.QUIZZES,
        goalValue: 5,
        rewardXP: 50,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString()
      };

      await expect(service.createMission(mockStudent, dto)).rejects.toThrow(ForbiddenException);
      expect(prisma.weeklyMission.create).not.toHaveBeenCalled();
    });
  });

  describe('joinMission', () => {
    it('should join mission', async () => {
      (prisma.weeklyMission.findUniqueOrThrow as any).mockResolvedValue(mockMission as any);
      (prisma.missionParticipant.upsert as any).mockResolvedValue({
        missionId: 1,
        userId: 2,
        progress: 0,
        completed: false
      } as any);

      const result = await service.joinMission(2, 1);

      expect(prisma.missionParticipant.upsert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('submitProgress', () => {
    it('should award XP when mission is completed', async () => {
      (prisma.weeklyMission.findUnique as any).mockResolvedValue(mockMission as any);
      // First call: find existing participant with progress 9
      (prisma.missionParticipant.findUnique as any).mockResolvedValueOnce({
        missionId: 1,
        userId: 2,
        progress: 9,
        completed: false
      } as any);
      // Update to progress 10 (but still not completed in this update)
      (prisma.missionParticipant.update as any).mockResolvedValueOnce({
        missionId: 1,
        userId: 2,
        progress: 10,
        completed: false  // First update doesn't set completed
      } as any);
      // Second update sets completed flag
      (prisma.missionParticipant.update as any).mockResolvedValueOnce({
        missionId: 1,
        userId: 2,
        progress: 10,
        completed: true
      } as any);
      // Final findUnique call
      (prisma.missionParticipant.findUnique as any).mockResolvedValueOnce({
        missionId: 1,
        userId: 2,
        progress: 10,
        completed: true
      } as any);
      (gamification.awardXP as any).mockResolvedValue(undefined);

      const result = await service.submitProgress(2, 1, { progress: 1 });

      expect(gamification.awardXP).toHaveBeenCalledWith(2, 100, expect.any(String));
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if mission does not exist', async () => {
      (prisma.weeklyMission.findUnique as any).mockResolvedValue(null);

      await expect(service.submitProgress(2, 999, { progress: 1 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('closeExpiredMissions', () => {
    it('should close expired missions', async () => {
      (prisma.weeklyMission.updateMany as any).mockResolvedValue({ count: 2 });

      await service.closeExpiredMissions();

      expect(prisma.weeklyMission.updateMany).toHaveBeenCalledWith({
        where: { endDate: { lt: expect.any(Date) }, status: 'ACTIVE' },
        data: { status: 'COMPLETED' }
      });
    });
  });
});

