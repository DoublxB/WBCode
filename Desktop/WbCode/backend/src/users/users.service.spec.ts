import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: { id: 1, name: 'STUDENT' },
    badges: [],
    xp: 100,
    level: 1,
    streak: 5,
    avatarUrl: null,
    title: null
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(mockUser),
        findMany: jest.fn().mockResolvedValue([])
      }
    } as unknown as PrismaService;

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile();

    service = module.get(UsersService);
    prisma = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile with badges', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser as any);

      const result = await service.getProfile(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { role: true, badges: { include: { badge: true } } }
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const dto = {
        avatarUrl: 'https://example.com/avatar.jpg',
        title: 'Code Master'
      };

      const updatedUser = { ...mockUser, ...dto };
      (prisma.user.update as any).mockResolvedValue(updatedUser as any);

      const result = await service.updateProfile(1, dto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('listUsers', () => {
    it('should return list of all users', async () => {
      const users = [mockUser];
      (prisma.user.findMany as any).mockResolvedValue(users as any);

      const result = await service.listUsers();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        include: { role: true }
      });
      expect(result).toEqual(users);
    });
  });
});

