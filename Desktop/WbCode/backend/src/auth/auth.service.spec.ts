import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwt: jest.Mocked<JwtService>;
  let config: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    roleId: 1,
    role: { id: 1, name: Role.STUDENT },
    avatarUrl: null,
    title: null,
    xp: 0,
    level: 1,
    streak: 0,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser)
      },
      role: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 1, name: Role.STUDENT })
      }
    } as any;

    const mockJwt = {
      signAsync: jest.fn()
    };

    const mockConfig = {
      get: jest.fn().mockReturnValue('test-secret')
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig }
      ]
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService) as any;
    jwt = module.get(JwtService) as any;
    config = module.get(ConfigService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.role.findUnique as any).mockResolvedValue({ id: 1, name: Role.STUDENT });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (prisma.user.create as any).mockResolvedValue({
        ...mockUser,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName
      });
      jwt.signAsync.mockResolvedValue('token');

      const result = await service.register(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 12);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw BadRequestException if email already exists', async () => {
      const dto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123'
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.user.update as any).mockResolvedValue(mockUser);
      jwt.signAsync.mockResolvedValue('token');

      const result = await service.login(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
        include: { role: true }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, mockUser.password);
      expect(prisma.user.update).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      const dto = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should issue new tokens for valid user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      jwt.signAsync.mockResolvedValue('newToken');

      const result = await service.refresh(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { role: true }
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(service.refresh(999)).rejects.toThrow(UnauthorizedException);
    });
  });
});

