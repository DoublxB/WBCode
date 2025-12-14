import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCodingExerciseDto, SupportedLanguage, SubmitCodeDto } from './dto/create-coding-exercise.dto';
import { Role } from '../common/constants/roles';
import { SandboxService } from '../sandbox/sandbox.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class CodingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sandbox: SandboxService,
    private readonly gamification: GamificationService
  ) {}

  listExercises() {
    return this.prisma.codingExercise.findMany({ orderBy: { id: 'desc' } });
  }

  async getExercise(id: number) {
    const exercise = await this.prisma.codingExercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async createExercise(user: { id: number; role: Role }, dto: CreateCodingExerciseDto) {
    if (user.role !== Role.PROFESSOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only professors can create coding exercises');
    }
    await this.prisma.lesson.findUniqueOrThrow({ where: { id: dto.lessonId } });
    return this.prisma.codingExercise.create({ 
      data: {
        ...dto,
        status: 'DRAFT'
      }
    });
  }

  async submit(userId: number, codingId: number, dto: SubmitCodeDto) {
    const exercise = await this.getExercise(codingId);
    
    // Verificare anti-copiat: multiple criterii
    const SUSPICIOUS_TYPING_SPEED = 25; // caractere/secundă
    const LARGE_PASTE_THRESHOLD = 50; // caractere
    
    // Verifică dacă există paste mare (indiferent de rata medie)
    const hasLargePaste = dto.hasLargePaste || (dto.largestPasteSize && dto.largestPasteSize > LARGE_PASTE_THRESHOLD);
    const isSuspicious = (dto.typingSpeed && dto.typingSpeed > SUSPICIOUS_TYPING_SPEED) || hasLargePaste;
    
    // Debug logging
    console.log('🔍 Anti-copy check:', {
      typingSpeed: dto.typingSpeed,
      timeSpent: dto.timeSpent,
      hasLargePaste,
      largestPasteSize: dto.largestPasteSize,
      isSuspicious,
      codeLength: dto.sourceCode.length,
      userId,
      exerciseId: codingId
    });
    
    const result = await this.sandbox.execute(
      exercise.language as SupportedLanguage, 
      dto.sourceCode, 
      dto.stdin ?? ''
    );
    
    const success = result.exitCode === 0;
    let score = success ? 100 : 0;
    
    // Aplicăm penalizare dacă e suspect
    if (isSuspicious && success) {
      score = Math.max(0, score - 20); // Penalizare de 20 puncte
      console.log('⚠️ Penalty applied! Score reduced from 100 to', score);
    }
    
    const feedback = success 
      ? (isSuspicious ? 'Execution successful (⚠️ Suspicious typing pattern detected)' : 'Execution successful')
      : `Errors: ${result.stderr}`;

    await this.prisma.submission.create({
      data: {
        userId,
        codingId,
        type: 'CODING',
        sourceCode: dto.sourceCode,
        score,
        maxScore: 100,
        feedback,
        runtimeStdout: result.stdout,
        runtimeStderr: result.stderr,
        explanation: isSuspicious 
          ? '⚠️ Your submission was flagged for suspicious typing patterns. Please write code yourself.'
          : (success ? 'Great job! Try optimizing further.' : 'Review the error output to fix your code.')
      }
    });

    // Nu acordăm XP dacă e suspect
    if (success && !isSuspicious) {
      await this.gamification.awardXP(userId, 50, `Coding exercise: ${exercise.title}`);
    }

    return { 
      success, 
      stdout: result.stdout, 
      stderr: result.stderr, 
      score,
      isSuspicious 
    };
  }
}



