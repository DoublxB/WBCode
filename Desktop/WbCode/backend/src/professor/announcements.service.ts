import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureProfessor(user: { role: Role }) {
    if (user.role !== Role.PROFESSOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only professors can create announcements');
    }
  }

  async createAnnouncement(
    professor: { id: number; role: Role },
    classId: number,
    title: string,
    content: string
  ) {
    this.ensureProfessor(professor);

    // Verify class exists and professor owns it
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    if (classEntity.professorId !== professor.id && professor.role !== Role.ADMIN) {
      throw new ForbiddenException('You are not the professor of this class');
    }

    return this.prisma.classAnnouncement.create({
      data: {
        classId,
        professorId: professor.id,
        title,
        content
      },
      include: {
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  async getClassAnnouncements(classId: number, user: { id: number; role: Role }) {
    // Verify class exists and user has access
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        members: true,
        professor: true
      }
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    // Check access
    if (user.role === Role.STUDENT) {
      const isMember = classEntity.members.some(m => m.studentId === user.id);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this class');
      }
    } else if (user.role === Role.PROFESSOR && classEntity.professorId !== user.id) {
      throw new ForbiddenException('You are not the professor of this class');
    }

    return this.prisma.classAnnouncement.findMany({
      where: { classId },
      include: {
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteAnnouncement(professor: { id: number; role: Role }, announcementId: number) {
    this.ensureProfessor(professor);

    const announcement = await this.prisma.classAnnouncement.findUnique({
      where: { id: announcementId },
      include: { class: true }
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (announcement.professorId !== professor.id && professor.role !== Role.ADMIN) {
      throw new ForbiddenException('You are not the author of this announcement');
    }

    await this.prisma.classAnnouncement.delete({
      where: { id: announcementId }
    });

    return { success: true };
  }
}

















