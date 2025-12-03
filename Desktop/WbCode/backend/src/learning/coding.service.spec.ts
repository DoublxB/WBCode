import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CodingService } from './coding.service';
import { PrismaService } from '../prisma/prisma.service';
import { SandboxService } from '../sandbox/sandbox.service';
import { GamificationService } from '../gamification/gamification.service';
import { Role } from '../common/constants/roles';
import { SupportedLanguage } from './dto/create-coding-exercise.dto';

describe('CodingService', () => {
  let service: CodingService;
  let prisma: jest.Mocked<PrismaService>;
  let sandbox: jest.Mocked<SandboxService>;
  let gamification: jest.Mocked<GamificationService>;

  const mockExercise = {
    id: 1,
    lessonId: 1,
    title: 'Test Exercise',
    description: 'Test Description',
        language: SupportedLanguage.PYTHON,
    starterCode: 'print("hello")',
    testCases: []
  };

  const mockProfessor = { id: 1, role: Role.PROFESSOR };
  const mockStudent = { id: 2, role: Role.STUDENT };

  beforeEach(async () => {
    const mockPrisma = {
      lesson: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 1 })
      },
      codingExercise: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockExercise)
      },
      submission: {
        create: jest.fn().mockResolvedValue({})
      }
    } as unknown as PrismaService;

    const mockSandbox = {
      execute: jest.fn().mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: '',
        runtimeMs: 100
      })
    } as any;

    const mockGamification = {
      awardXP: jest.fn().mockResolvedValue(undefined)
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        CodingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SandboxService, useValue: mockSandbox },
        { provide: GamificationService, useValue: mockGamification }
      ]
    }).compile();

    service = module.get(CodingService);
    prisma = module.get(PrismaService) as any;
    sandbox = module.get(SandboxService) as any;
    gamification = module.get(GamificationService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listExercises', () => {
    it('should return list of exercises', async () => {
      const exercises = [mockExercise];
      (prisma.codingExercise.findMany as any).mockResolvedValue(exercises as any);

      const result = await service.listExercises();

      expect(prisma.codingExercise.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'desc' }
      });
      expect(result).toEqual(exercises);
    });
  });

  describe('getExercise', () => {
    it('should return exercise by id', async () => {
      (prisma.codingExercise.findUnique as any).mockResolvedValue(mockExercise as any);

      const result = await service.getExercise(1);

      expect(prisma.codingExercise.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockExercise);
    });

    it('should throw NotFoundException if exercise does not exist', async () => {
      (prisma.codingExercise.findUnique as any).mockResolvedValue(null);

      await expect(service.getExercise(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createExercise', () => {
    it('should create exercise as professor', async () => {
      const dto = {
        lessonId: 1,
        title: 'New Exercise',
        prompt: 'Write a function',
        difficulty: 'BEGINNER',
        language: SupportedLanguage.PYTHON,
        starterCode: 'code'
      };

      (prisma.lesson.findUniqueOrThrow as any).mockResolvedValue({ id: 1 } as any);
      (prisma.codingExercise.create as any).mockResolvedValue(mockExercise as any);

      const result = await service.createExercise(mockProfessor, dto);

      expect(prisma.lesson.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: dto.lessonId } });
      expect(prisma.codingExercise.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if student tries to create', async () => {
      const dto = {
        lessonId: 1,
        title: 'Exercise',
        prompt: 'Write a function',
        difficulty: 'BEGINNER',
        language: SupportedLanguage.PYTHON,
        starterCode: 'code'
      };

      await expect(service.createExercise(mockStudent, dto)).rejects.toThrow(ForbiddenException);
      expect(prisma.codingExercise.create).not.toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('should submit code and award XP on success', async () => {
      const dto = {
        sourceCode: 'print("hello")',
        stdin: ''
      };

      (prisma.codingExercise.findUnique as any).mockResolvedValue(mockExercise as any);
      sandbox.execute.mockResolvedValue({
        exitCode: 0,
        stdout: 'hello',
        stderr: '',
        runtimeMs: 100
      });
      (prisma.submission.create as any).mockResolvedValue({} as any);
      (gamification.awardXP as any).mockResolvedValue(undefined);

      const result = await service.submit(1, 1, dto);

      expect(sandbox.execute).toHaveBeenCalledWith('PYTHON', dto.sourceCode, dto.stdin);
      expect(prisma.submission.create).toHaveBeenCalled();
      expect(gamification.awardXP).toHaveBeenCalledWith(1, 50, expect.any(String));
      expect(result.success).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should handle execution errors', async () => {
      const dto = {
        sourceCode: 'invalid code',
        stdin: ''
      };

      (prisma.codingExercise.findUnique as any).mockResolvedValue(mockExercise as any);
      sandbox.execute.mockResolvedValue({
        exitCode: 1,
        stdout: '',
        stderr: 'SyntaxError',
        runtimeMs: 50
      });
      (prisma.submission.create as any).mockResolvedValue({} as any);

      const result = await service.submit(1, 1, dto);

      expect(gamification.awardXP).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.score).toBe(0);
    });
  });
});

