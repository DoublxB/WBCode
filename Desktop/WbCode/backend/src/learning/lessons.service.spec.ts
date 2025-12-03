import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

describe('LessonsService', () => {
  let service: LessonsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockLesson = {
    id: 1,
    title: 'Test Lesson',
    description: 'Test Description',
    content: 'Test Content',
    difficulty: 'BEGINNER',
    tags: [],
    authorId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockProfessor = { id: 1, role: Role.PROFESSOR };
  const mockStudent = { id: 2, role: Role.STUDENT };
  const mockAdmin = { id: 3, role: Role.ADMIN };

  beforeEach(async () => {
    const mockPrisma = {
      lesson: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockLesson),
        update: jest.fn().mockResolvedValue(mockLesson),
        delete: jest.fn().mockResolvedValue(mockLesson)
      }
    } as unknown as PrismaService;

    const module = await Test.createTestingModule({
      providers: [
        LessonsService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile();

    service = module.get(LessonsService);
    prisma = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listLessons', () => {
    it('should return list of lessons', async () => {
      const lessons = [mockLesson];
      (prisma.lesson.findMany as any).mockResolvedValue(lessons as any);

      const result = await service.listLessons();

      expect(prisma.lesson.findMany).toHaveBeenCalledWith({
        include: { quizzes: true, codingTasks: true },
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toEqual(lessons);
    });
  });

  describe('getLesson', () => {
    it('should return lesson by id', async () => {
      (prisma.lesson.findUnique as any).mockResolvedValue(mockLesson as any);

      const result = await service.getLesson(1);

      expect(prisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { quizzes: { include: { questions: true } }, codingTasks: true }
      });
      expect(result).toEqual(mockLesson);
    });

    it('should throw NotFoundException if lesson does not exist', async () => {
      (prisma.lesson.findUnique as any).mockResolvedValue(null);

      await expect(service.getLesson(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLesson', () => {
    it('should create lesson as professor', async () => {
      const dto = {
        title: 'New Lesson',
        description: 'New Description',
        content: 'New Content',
        difficulty: 'INTERMEDIATE',
        tags: ['tag1', 'tag2']
      };

      (prisma.lesson.create as any).mockResolvedValue({ ...mockLesson, ...dto } as any);

      const result = await service.createLesson(mockProfessor, dto);

      expect(prisma.lesson.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          tags: dto.tags,
          authorId: mockProfessor.id
        }
      });
      expect(result).toHaveProperty('title', dto.title);
    });

    it('should create lesson as admin', async () => {
      const dto = {
        title: 'Admin Lesson',
        description: 'Description',
        content: 'Content',
        difficulty: 'BEGINNER',
        tags: []
      };

      (prisma.lesson.create as any).mockResolvedValue({ ...mockLesson, ...dto } as any);

      const result = await service.createLesson(mockAdmin, dto);

      expect(prisma.lesson.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if student tries to create', async () => {
      const dto = {
        title: 'Student Lesson',
        description: 'Description',
        content: 'Content',
        difficulty: 'BEGINNER',
        tags: []
      };

      await expect(service.createLesson(mockStudent, dto)).rejects.toThrow(ForbiddenException);
      expect(prisma.lesson.create).not.toHaveBeenCalled();
    });
  });

  describe('updateLesson', () => {
    it('should update lesson if user is author', async () => {
      const dto = { title: 'Updated Title' };
      (prisma.lesson.findUnique as any).mockResolvedValue(mockLesson as any);
      (prisma.lesson.update as any).mockResolvedValue({ ...mockLesson, ...dto } as any);

      const result = await service.updateLesson(1, mockProfessor, dto);

      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto
      });
      expect(result).toHaveProperty('title', dto.title);
    });

    it('should allow admin to update any lesson', async () => {
      const dto = { title: 'Admin Updated' };
      (prisma.lesson.findUnique as any).mockResolvedValue(mockLesson as any);
      (prisma.lesson.update as any).mockResolvedValue({ ...mockLesson, ...dto } as any);

      const result = await service.updateLesson(1, mockAdmin, dto);

      expect(prisma.lesson.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if user is not author or admin', async () => {
      const dto = { title: 'Updated' };
      (prisma.lesson.findUnique as any).mockResolvedValue(mockLesson as any);

      await expect(service.updateLesson(1, mockStudent, dto)).rejects.toThrow(ForbiddenException);
      expect(prisma.lesson.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteLesson', () => {
    it('should delete lesson if user is author', async () => {
      (prisma.lesson.findUnique as any).mockResolvedValue(mockLesson as any);
      (prisma.lesson.delete as any).mockResolvedValue(mockLesson as any);

      const result = await service.deleteLesson(1, mockProfessor);

      expect(prisma.lesson.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundException if lesson does not exist', async () => {
      (prisma.lesson.findUnique as any).mockResolvedValue(null);

      await expect(service.deleteLesson(999, mockProfessor)).rejects.toThrow(NotFoundException);
      expect(prisma.lesson.delete).not.toHaveBeenCalled();
    });
  });
});

