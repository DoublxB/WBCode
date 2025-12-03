import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: jest.Mocked<PrismaService>;

  const mockAdmin = { id: 1, role: Role.ADMIN };
  const mockStudent = { id: 2, role: Role.STUDENT };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({ id: 1, roleId: 2 })
      },
      role: {
        findUnique: jest.fn().mockResolvedValue(null)
      }
    } as unknown as PrismaService;

    const module = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile();

    service = module.get(AdminService);
    prisma = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return all users for admin', async () => {
      const users = [{ id: 1, email: 'test@example.com', role: { name: Role.STUDENT } }];
      (prisma.user.findMany as any).mockResolvedValue(users as any);

      const result = await service.listUsers(mockAdmin);

      expect(prisma.user.findMany).toHaveBeenCalledWith({ include: { role: true } });
      expect(result).toEqual(users);
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      await expect(service.listUsers(mockStudent)).rejects.toThrow(ForbiddenException);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe('updateUserRole', () => {
    it('should update user role as admin', async () => {
      (prisma.role.findUnique as any).mockResolvedValue({ id: 2, name: Role.PROFESSOR } as any);
      (prisma.user.update as any).mockResolvedValue({
        id: 1,
        roleId: 2
      } as any);

      const result = await service.updateUserRole(mockAdmin, 1, Role.PROFESSOR);

      expect(prisma.role.findUnique).toHaveBeenCalledWith({ where: { name: Role.PROFESSOR } });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { roleId: 2 }
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if role does not exist', async () => {
      (prisma.role.findUnique as any).mockResolvedValue(null);

      await expect(service.updateUserRole(mockAdmin, 1, Role.PROFESSOR)).rejects.toThrow(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      await expect(service.updateUserRole(mockStudent, 1, Role.PROFESSOR)).rejects.toThrow(ForbiddenException);
    });
  });
});

