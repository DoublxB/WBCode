import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EmailService } from '../common/services/email.service';
import { BadgesService } from '../gamification/badges.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly badges: BadgesService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const roleName = dto.role || Role.STUDENT;
    const role = await this.ensureRole(roleName);
    const hashed = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: role.id,
        avatarUrl: null,
        title: null
      },
      include: { role: true }
    });

    // Referral: if a referral code was provided, mark invite as accepted (for viral coefficient).
    if (dto.referralCode) {
      try {
        const invite = await this.prisma.referralInvite.findUnique({
          where: { code: dto.referralCode }
        });

        if (invite && !invite.acceptedAt && !invite.acceptedUserId) {
          await this.prisma.referralInvite.update({
            where: { code: dto.referralCode },
            data: { acceptedAt: new Date(), acceptedUserId: user.id }
          });
        }
      } catch (e) {
        // Never fail registration due to referral issues.
        console.warn('[register] referralCode handling failed', e);
      }
    }

    // SOCIAL starter badge (0 friends)
    // If badge exists, it will emit unlock event for toast on first login/profile fetch.
    await this.badges.awardByCode(user.id, 'social_localhost');

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email: dto.email }, include: { role: true } });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const matches = await bcrypt.compare(dto.password, user.password);
      if (!matches) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Maintain login streak: increment at most once per calendar day.
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;

      const shouldIncrement = !lastLogin || lastLogin < todayStart;
      const nextStreak = shouldIncrement ? (user.streak ?? 0) + 1 : (user.streak ?? 0);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: now, streak: nextStreak }
      });

      if (shouldIncrement) {
        await this.badges.checkLoginStreak(user.id, nextStreak);
      }

      return this.issueTokens(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async refresh(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.issueTokens(user);
  }

  private async ensureRole(roleName: Role) {
    let role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      role = await this.prisma.role.create({ data: { name: roleName } });
    }
    return role;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiry

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // Send email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: dto.token }
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    return { message: 'Password has been reset successfully' };
  }

  private async issueTokens(user: { id: number; email: string; role: { name: Role | string } }) {
    const roleName = user.role.name as Role;
    const payload: JwtPayload = { sub: user.id, email: user.email, role: roleName };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '30m'
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d'
    });
    return { accessToken, refreshToken };
  }
}



