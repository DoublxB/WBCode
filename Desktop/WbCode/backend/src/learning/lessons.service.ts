import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Role } from '../common/constants/roles';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

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
        authorId: author.id
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
}



