import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ProfessorDashboardService } from './professor-dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

describe('ProfessorDashboardService', () => {
  let service: ProfessorDashboardService;
  let prisma: jest.Mocked<PrismaService>;

  const mockProfessor = { id: 1, role: Role.PROFESSOR };
  const mockStudent = { id: 2, role: Role.STUDENT };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _avg: { xp: 0 } })
      },
      submission: {
        count: jest.fn().mockResolvedValue(0)
      },
      leaderboardEntry: {
        findMany: jest.fn().mockResolvedValue([])
      },
      professorReport: {
        create: jest.fn().mockResolvedValue({})
      }
    } as unknown as PrismaService;

    const module = await Test.createTestingModule({
      providers: [
        ProfessorDashboardService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile();

    service = module.get(ProfessorDashboardService);
    prisma = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard data for professor', async () => {
      (prisma.user.count as any).mockResolvedValue(50);
      (prisma.submission.count as any).mockResolvedValue(200);
      (prisma.user.aggregate as any).mockResolvedValue({ _avg: { xp: 500 } } as any);
      (prisma.leaderboardEntry.findMany as any).mockResolvedValue([
        { rank: 1, xp: 1000, user: { firstName: 'John', lastName: 'Doe' } }
      ] as any);

      const result = await service.getDashboard(mockProfessor);

      expect(prisma.user.count).toHaveBeenCalled();
      expect(prisma.submission.count).toHaveBeenCalled();
      expect(result).toHaveProperty('totalStudents', 50);
      expect(result).toHaveProperty('totalSubmissions', 200);
      expect(result).toHaveProperty('avgXP', 500);
      expect(result).toHaveProperty('topLearners');
    });

    it('should throw ForbiddenException if user is not professor', async () => {
      await expect(service.getDashboard(mockStudent)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('exportProgressReport', () => {
    it('should export CSV report', async () => {
      (prisma.user.count as any).mockResolvedValue(50);
      (prisma.submission.count as any).mockResolvedValue(200);
      (prisma.user.aggregate as any).mockResolvedValue({ _avg: { xp: 500 } } as any);
      (prisma.leaderboardEntry.findMany as any).mockResolvedValue([
        { rank: 1, xp: 1000, user: { firstName: 'John', lastName: 'Doe' } }
      ] as any);
      (prisma.professorReport.create as any).mockResolvedValue({} as any);

      const result = await service.exportProgressReport(mockProfessor);

      expect(result).toHaveProperty('mime', 'text/csv');
      expect(result).toHaveProperty('data');
      expect(result.data).toContain('rank,name,xp');
      expect(prisma.professorReport.create).toHaveBeenCalled();
    });
  });
});

