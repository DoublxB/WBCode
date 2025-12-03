import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { Role } from '../common/constants/roles';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService, private readonly gamification: GamificationService) {}

  async createQuiz(user: { id: number; role: Role }, dto: CreateQuizDto) {
    if (user.role !== Role.PROFESSOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only professors can create quizzes');
    }
    await this.prisma.lesson.findUniqueOrThrow({ where: { id: dto.lessonId } });
    const quiz = await this.prisma.quiz.create({
      data: {
        lessonId: dto.lessonId,
        title: dto.title,
        description: dto.description,
        timeLimit: dto.timeLimit,
        questions: {
          create: dto.questions.map((q) => ({
            prompt: q.prompt,
            type: q.type,
            options: q.options || [],
            answerKey: q.answerKey,
            explanation: q.explanation
          }))
        }
      },
      include: { questions: true }
    });
    return quiz;
  }

  getQuiz(id: number) {
    return this.prisma.quiz.findUnique({
      where: { id },
      include: { questions: true }
    });
  }

  async submitQuiz(userId: number, quizId: number, dto: SubmitQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true }
    });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const answersMap = new Map(dto.answers.map((a) => [a.questionId, a.answer]));
    let correct = 0;
    const feedbackParts: string[] = [];

    quiz.questions.forEach((question: { id: number; answerKey: string; prompt: string; explanation: string | null }) => {
      const answer = answersMap.get(question.id);
      if (answer && answer.trim().toLowerCase() === question.answerKey.trim().toLowerCase()) {
        correct += 1;
      } else {
        feedbackParts.push(`Question "${question.prompt}": ${question.explanation}`);
      }
    });

    const score = correct;
    const maxScore = quiz.questions.length;
    const xpGain = correct * 15;

    await this.prisma.submission.create({
      data: {
        userId,
        quizId,
        type: 'QUIZ',
        answers: dto.answers as any,
        score,
        maxScore,
        feedback: feedbackParts.length ? feedbackParts.join('\n') : 'Perfect score!',
        explanation: feedbackParts.join('\n')
      }
    });

    if (xpGain > 0) {
      await this.gamification.awardXP(userId, xpGain, `Quiz ${quiz.title} completion`);
    }

    return { score, maxScore, xpGain, feedback: feedbackParts };
  }
}


