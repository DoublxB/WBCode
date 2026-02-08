import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Role } from '../common/constants/roles';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService
  ) {}

  listLessons() {
    return this.prisma.lesson.findMany({
      include: { quizzes: true, codingTasks: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getLesson(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: { quizzes: { include: { questions: true } }, codingTasks: true }
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    return lesson;
  }

  async createLesson(author: { id: number; role: Role }, dto: CreateLessonDto) {
    if (author.role !== Role.PROFESSOR && author.role !== Role.ADMIN) {
      throw new ForbiddenException('Only professors can create lessons');
    }
    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        description: dto.description,
        content: dto.content,
        difficulty: dto.difficulty,
        tags: dto.tags ?? [],
        authorId: author.id,
        status: 'DRAFT'
      }
    });
  }

  async updateLesson(id: number, author: { id: number; role: Role }, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.authorId !== author.id && author.role !== Role.ADMIN) {
      throw new ForbiddenException('Not allowed to edit this lesson');
    }
    return this.prisma.lesson.update({
      where: { id },
      data: dto
    });
  }

  async deleteLesson(id: number, author: { id: number; role: Role }) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.authorId !== author.id && author.role !== Role.ADMIN) {
      throw new ForbiddenException('Not allowed to delete this lesson');
    }
    await this.prisma.lesson.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Marchează un curs ca citit de către un utilizator
   */
  async markLessonAsRead(userId: number, lessonId: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Verifică dacă cursul a fost deja marcat ca citit
    const existingRead = await this.prisma.lessonRead.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });

    if (existingRead) {
      return existingRead; // Deja citit
    }

    // Marchează cursul ca citit
    const lessonRead = await this.prisma.lessonRead.create({
      data: {
        userId,
        lessonId
      }
    });

    // Verifică badge-urile pentru cursuri citite
    await this.gamification.checkLessonReadBadges(userId);

    return lessonRead;
  }

  /**
   * Verifică dacă un curs a fost citit de către un utilizator
   */
  async isLessonRead(userId: number, lessonId: number): Promise<boolean> {
    const read = await this.prisma.lessonRead.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });
    return !!read;
  }
}



