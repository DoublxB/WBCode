import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureProfessor(user: { role: Role }) {
    if (user.role !== Role.PROFESSOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only professors can create assignments');
    }
  }

  async createAssignment(
    professor: { id: number; role: Role },
    classId: number,
    title: string,
    description: string,
    type: 'PROBLEM' | 'HOMEWORK' | 'MATERIAL',
    difficulty: string,
    contentId?: number,
    contentType?: 'LESSON' | 'QUIZ' | 'CODING_EXERCISE',
    dueDate?: Date
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

    // If contentId is provided, verify it exists
    if (contentId && contentType) {
      let contentExists = false;
      if (contentType === 'LESSON') {
        const lesson = await this.prisma.lesson.findUnique({ where: { id: contentId } });
        contentExists = !!lesson && lesson.status === 'PUBLISHED';
      } else if (contentType === 'QUIZ') {
        const quiz = await this.prisma.quiz.findUnique({ where: { id: contentId } });
        contentExists = !!quiz && quiz.status === 'PUBLISHED';
      } else if (contentType === 'CODING_EXERCISE') {
        const exercise = await this.prisma.codingExercise.findUnique({ where: { id: contentId } });
        contentExists = !!exercise && exercise.status === 'PUBLISHED';
      }

      if (!contentExists) {
        throw new BadRequestException('Content not found or not published');
      }
    }

    // Create assignment with PENDING_APPROVAL status if it's a PROBLEM or HOMEWORK
    const status = (type === 'PROBLEM' || type === 'HOMEWORK') ? 'PENDING_APPROVAL' : 'DRAFT';

    return this.prisma.classAssignment.create({
      data: {
        classId,
        professorId: professor.id,
        title,
        description,
        type,
        difficulty,
        contentId,
        contentType,
        dueDate,
        status
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
        class: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async getClassAssignments(classId: number, user: { id: number; role: Role }) {
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
      // Students only see published assignments
      return this.prisma.classAssignment.findMany({
        where: {
          classId,
          status: 'PUBLISHED'
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
          submissions: {
            where: { studentId: user.id }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (user.role === Role.PROFESSOR && classEntity.professorId !== user.id) {
      throw new ForbiddenException('You are not the professor of this class');
    }

    // Professor sees all assignments
    return this.prisma.classAssignment.findMany({
      where: { classId },
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
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async submitAssignment(
    student: { id: number; role: Role },
    assignmentId: number,
    submissionId: number
  ) {
    if (student.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can submit assignments');
    }

    const assignment = await this.prisma.classAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          include: {
            members: true
          }
        }
      }
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.status !== 'PUBLISHED') {
      throw new BadRequestException('Assignment is not published');
    }

    // Check if student is member of the class
    const isMember = assignment.class.members.some(m => m.studentId === student.id);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this class');
    }

    // Verify submission exists and belongs to student
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission || submission.userId !== student.id) {
      throw new NotFoundException('Submission not found');
    }

    // Check if already submitted
    const existing = await this.prisma.classAssignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: student.id
      }
    });

    if (existing) {
      // Update existing submission
      return this.prisma.classAssignmentSubmission.update({
        where: { id: existing.id },
        data: {
          submissionId,
          score: submission.score,
          maxScore: submission.maxScore
        }
      });
    }

    return this.prisma.classAssignmentSubmission.create({
      data: {
        assignmentId,
        studentId: student.id,
        submissionId,
        score: submission.score,
        maxScore: submission.maxScore
      }
    });
  }

  async getAssignmentById(
    classId: number,
    assignmentId: number,
    user: { id: number; role: Role }
  ) {
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
    const roleString = typeof user.role === 'string' ? user.role.toUpperCase() : user.role;
    const isStudent = roleString === Role.STUDENT || roleString === 'STUDENT';
    const isProfessor = roleString === Role.PROFESSOR || roleString === 'PROFESSOR';
    const isAdmin = roleString === Role.ADMIN || roleString === 'ADMIN';
    
    if (isStudent) {
      const isMember = classEntity.members.some(m => m.studentId === user.id);
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this class');
      }
    } else if (isProfessor && classEntity.professorId !== user.id && !isAdmin) {
      throw new ForbiddenException('You are not the professor of this class');
    }

    // Get assignment
    const assignment = await this.prisma.classAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        },
        submissions: isStudent
          ? {
              where: { studentId: user.id }
            }
          : {
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
      }
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.classId !== classId) {
      throw new BadRequestException('Assignment does not belong to this class');
    }

    // Students only see published assignments
    if (isStudent && assignment.status !== 'PUBLISHED') {
      throw new ForbiddenException('Assignment is not published');
    }

    // Fetch submission details if submissionId exists
    if (assignment.submissions && assignment.submissions.length > 0) {
      const submissionIds = assignment.submissions
        .map((s: any) => s.submissionId)
        .filter((id: any): id is number => id !== null && id !== undefined);
      
      if (submissionIds.length > 0) {
        const submissions = await this.prisma.submission.findMany({
          where: { id: { in: submissionIds } },
          select: {
            id: true,
            score: true,
            maxScore: true,
            feedback: true,
            createdAt: true
          }
        });

        // Map submissions to assignment submissions
        assignment.submissions = assignment.submissions.map((as: any) => ({
          ...as,
          submission: submissions.find(s => s.id === as.submissionId) || null
        }));
      }
    }

    return assignment;
  }
}










