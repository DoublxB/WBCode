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
    return this.prisma.codingExercise.create({ data: dto });
  }

  async submit(userId: number, codingId: number, dto: SubmitCodeDto) {
    const exercise = await this.getExercise(codingId);
    const result = await this.sandbox.execute(exercise.language as SupportedLanguage, dto.sourceCode, dto.stdin ?? '');
    const success = result.exitCode === 0;
    const score = success ? 100 : 0;
    const feedback = success ? 'Execution successful' : `Errors: ${result.stderr}`;

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
        explanation: success ? 'Great job! Try optimizing further.' : 'Review the error output to fix your code.'
      }
    });

    if (success) {
      await this.gamification.awardXP(userId, 50, `Coding exercise: ${exercise.title}`);
    }

    return { success, stdout: result.stdout, stderr: result.stderr, score };
  }
}



