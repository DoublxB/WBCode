import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

@Injectable()
export class ApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureAdmin(user: { role: Role }) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin privileges required');
    }
  }

  async submitForApproval(
    professor: { id: number; role: Role },
    contentType: 'LESSON' | 'QUIZ' | 'CODING_EXERCISE',
    contentId: number
  ) {
    const isAdmin = professor.role === Role.ADMIN;
    const isProfessor = professor.role === Role.PROFESSOR;

    if (!isProfessor && !isAdmin) {
      throw new ForbiddenException('Only professors or admins can submit content for approval');
    }

    // Verify content exists (and ownership if professor)
    let contentExists = false;
    if (contentType === 'LESSON') {
      const lesson = await this.prisma.lesson.findFirst({
        where: isProfessor ? { id: contentId, authorId: professor.id } : { id: contentId }
      });
      contentExists = !!lesson;
    } else if (contentType === 'QUIZ') {
      const quiz = await this.prisma.quiz.findUnique({
        where: { id: contentId },
        include: { lesson: true }
      });
      contentExists =
        !!quiz &&
        (isAdmin || (quiz.lesson && quiz.lesson.authorId === professor.id));
    } else if (contentType === 'CODING_EXERCISE') {
      const exercise = await this.prisma.codingExercise.findUnique({
        where: { id: contentId },
        include: { lesson: true }
      });
      contentExists =
        !!exercise &&
        (isAdmin || (exercise.lesson && exercise.lesson.authorId === professor.id));
    }

    if (!contentExists) {
      throw new NotFoundException('Content not found or you are not the author');
    }

    // Check if approval already exists
    const existing = await this.prisma.contentApproval.findFirst({
      where: {
        contentType,
        contentId,
        status: { in: ['PENDING', 'REVISIONS_REQUESTED'] }
      }
    });

    if (existing) {
      throw new ForbiddenException('Content already submitted for approval');
    }

    return this.prisma.contentApproval.create({
      data: {
        contentType,
        contentId,
        professorId: professor.id,
        status: 'PENDING'
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

  async listPendingApprovals(admin: { role: Role }) {
    this.ensureAdmin(admin);
    
    const approvals = await this.prisma.contentApproval.findMany({
      where: { status: 'PENDING' },
      include: {
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        admin: {
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

    // Fetch actual content for each approval
    const approvalsWithContent = await Promise.all(
      approvals.map(async (approval) => {
        let content = null;
        
        if (approval.contentType === 'LESSON') {
          content = await this.prisma.lesson.findUnique({
            where: { id: approval.contentId },
            include: { author: { select: { id: true, firstName: true, lastName: true } } }
          });
        } else if (approval.contentType === 'QUIZ') {
          content = await this.prisma.quiz.findUnique({
            where: { id: approval.contentId },
            include: {
              lesson: { include: { author: { select: { id: true, firstName: true, lastName: true } } } },
              questions: true
            }
          });
        } else if (approval.contentType === 'CODING_EXERCISE') {
          content = await this.prisma.codingExercise.findUnique({
            where: { id: approval.contentId },
            include: {
              lesson: { include: { author: { select: { id: true, firstName: true, lastName: true } } } }
            }
          });
        }

        return { ...approval, content };
      })
    );

    return approvalsWithContent;
  }

  async reviewApproval(
    admin: { id: number; role: Role },
    approvalId: number,
    status: 'APPROVED' | 'REJECTED' | 'REVISIONS_REQUESTED',
    adminNotes?: string
  ) {
    this.ensureAdmin(admin);

    const approval = await this.prisma.contentApproval.findUnique({
      where: { id: approvalId }
    });

    if (!approval) {
      throw new NotFoundException('Approval request not found');
    }

    if (approval.status !== 'PENDING' && approval.status !== 'REVISIONS_REQUESTED') {
      throw new ForbiddenException('Approval already reviewed');
    }

    // Update approval
    const updated = await this.prisma.contentApproval.update({
      where: { id: approvalId },
      data: {
        status,
        adminId: admin.id,
        adminNotes,
        reviewedAt: new Date()
      },
      include: {
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // If approved, update content status to PUBLISHED
    if (status === 'APPROVED') {
      if (approval.contentType === 'LESSON') {
        await this.prisma.lesson.update({
          where: { id: approval.contentId },
          data: { status: 'PUBLISHED' }
        });
      } else if (approval.contentType === 'QUIZ') {
        await this.prisma.quiz.update({
          where: { id: approval.contentId },
          data: { status: 'PUBLISHED' }
        });
      } else if (approval.contentType === 'CODING_EXERCISE') {
        await this.prisma.codingExercise.update({
          where: { id: approval.contentId },
          data: { status: 'PUBLISHED' }
        });
      }
    }

    return updated;
  }

  async getMySubmissions(professor: { id: number; role: Role }) {
    if (professor.role !== Role.PROFESSOR) {
      throw new ForbiddenException('Only professors can view their submissions');
    }

    return this.prisma.contentApproval.findMany({
      where: { professorId: professor.id },
      include: {
        admin: {
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
}




