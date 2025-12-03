import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { Role } from '../common/constants/roles';

describe('QuizzesService', () => {
  let service: QuizzesService;
  let prisma: jest.Mocked<PrismaService>;
  let gamification: jest.Mocked<GamificationService>;

  const mockQuiz = {
    id: 1,
    lessonId: 1,
    title: 'Test Quiz',
    description: 'Test Description',
    timeLimit: 30,
    questions: [
      {
        id: 1,
        prompt: 'What is 2+2?',
        type: 'MULTIPLE_CHOICE',
        options: ['2', '3', '4', '5'],
        answerKey: '4',
        explanation: '2+2 equals 4'
      }
    ]
  };

  const mockProfessor = { id: 1, role: Role.PROFESSOR };
  const mockStudent = { id: 2, role: Role.STUDENT };

  beforeEach(async () => {
    const mockPrisma = {
      lesson: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 1 })
      },
      quiz: {
        create: jest.fn().mockResolvedValue(mockQuiz),
        findUnique: jest.fn().mockResolvedValue(null)
      },
      submission: {
        create: jest.fn().mockResolvedValue({})
      }
    } as unknown as PrismaService;

    const mockGamification = {
      awardXP: jest.fn().mockResolvedValue(undefined)
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GamificationService, useValue: mockGamification }
      ]
    }).compile();

    service = module.get(QuizzesService);
    prisma = module.get(PrismaService) as any;
    gamification = module.get(GamificationService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuiz', () => {
    it('should create quiz as professor', async () => {
      const dto = {
        lessonId: 1,
        title: 'New Quiz',
        description: 'Description',
        timeLimit: 30,
        questions: [
          {
            prompt: 'Test?',
            type: 'MULTIPLE_CHOICE',
            options: ['A', 'B'],
            answerKey: 'A',
            explanation: 'Explanation'
          }
        ]
      };

      (prisma.lesson.findUniqueOrThrow as any).mockResolvedValue({ id: 1 } as any);
      (prisma.quiz.create as any).mockResolvedValue(mockQuiz as any);

      const result = await service.createQuiz(mockProfessor, dto);

      expect(prisma.lesson.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: dto.lessonId } });
      expect(prisma.quiz.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if student tries to create', async () => {
      const dto = {
        lessonId: 1,
        title: 'Quiz',
        description: 'Description',
        timeLimit: 30,
        questions: []
      };

      await expect(service.createQuiz(mockStudent, dto)).rejects.toThrow(ForbiddenException);
      expect(prisma.quiz.create).not.toHaveBeenCalled();
    });
  });

  describe('getQuiz', () => {
    it('should return quiz by id', async () => {
      (prisma.quiz.findUnique as any).mockResolvedValue(mockQuiz as any);

      const result = await service.getQuiz(1);

      expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { questions: true }
      });
      expect(result).toEqual(mockQuiz);
    });
  });

  describe('submitQuiz', () => {
    it('should submit quiz and award XP for correct answers', async () => {
      const dto = {
        answers: [{ questionId: 1, answer: '4' }]
      };

      (prisma.quiz.findUnique as any).mockResolvedValue(mockQuiz as any);
      (prisma.submission.create as any).mockResolvedValue({} as any);
      (gamification.awardXP as any).mockResolvedValue(undefined);

      const result = await service.submitQuiz(1, 1, dto);

      expect(prisma.submission.create).toHaveBeenCalled();
      expect(gamification.awardXP).toHaveBeenCalledWith(1, 15, expect.any(String));
      expect(result).toHaveProperty('score', 1);
      expect(result).toHaveProperty('maxScore', 1);
      expect(result).toHaveProperty('xpGain', 15);
    });

    it('should handle incorrect answers', async () => {
      const dto = {
        answers: [{ questionId: 1, answer: '5' }]
      };

      (prisma.quiz.findUnique as any).mockResolvedValue(mockQuiz as any);
      (prisma.submission.create as any).mockResolvedValue({} as any);

      const result = await service.submitQuiz(1, 1, dto);

      expect(prisma.submission.create).toHaveBeenCalled();
      expect(gamification.awardXP).not.toHaveBeenCalled();
      expect(result.score).toBe(0);
    });

    it('should throw NotFoundException if quiz does not exist', async () => {
      const dto = {
        answers: []
      };

      (prisma.quiz.findUnique as any).mockResolvedValue(null);

      await expect(service.submitQuiz(1, 999, dto)).rejects.toThrow(NotFoundException);
    });
  });
});

