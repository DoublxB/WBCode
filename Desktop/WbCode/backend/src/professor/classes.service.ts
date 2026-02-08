import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';
import { randomBytes } from 'crypto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureProfessor(user: { role: Role }) {
    if (user.role !== Role.PROFESSOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only professors can manage classes');
    }
  }

  private generateInvitationCode(): string {
    // Generate a 6-character alphanumeric code
    return randomBytes(3).toString('hex').toUpperCase().substring(0, 6);
  }

  async createClass(
    professor: { id: number; role: Role },
    name: string,
    description?: string,
    usesRoadmap: boolean = false
  ) {
    this.ensureProfessor(professor);

    // Generate unique invitation code
    let invitationCode = this.generateInvitationCode();
    let exists = await this.prisma.class.findUnique({ where: { invitationCode } });
    while (exists) {
      invitationCode = this.generateInvitationCode();
      exists = await this.prisma.class.findUnique({ where: { invitationCode } });
    }

    try {
      const newClass = await this.prisma.class.create({
        data: {
          name,
          description: description || null,
          professorId: professor.id,
          invitationCode,
          usesRoadmap
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
          _count: {
            select: {
              members: true,
              announcements: true,
              assignments: true
            }
          }
        }
      });
      return newClass;
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  }

  async getMyClasses(professor: { id: number; role: Role }) {
    this.ensureProfessor(professor);

    return this.prisma.class.findMany({
      where: { professorId: professor.id },
      include: {
        _count: {
          select: {
            members: true,
            announcements: true,
            assignments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getClassById(classId: number, user: { id: number; role: Role }) {
    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        professor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        members: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                xp: true,
                level: true
              }
            }
          }
        },
        announcements: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        assignments: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    // Check if user has access
    // Normalize role pentru comparație
    const roleString = typeof user.role === 'string' ? user.role.toUpperCase() : user.role;
    const isStudent = roleString === Role.STUDENT || roleString === 'STUDENT';
    const isProfessor = roleString === Role.PROFESSOR || roleString === 'PROFESSOR';
    const isAdmin = roleString === Role.ADMIN || roleString === 'ADMIN';
    
    console.log('🔍 getClassById - Checking access:', {
      userId: user.id,
      userRole: user.role,
      roleString,
      isStudent,
      isProfessor,
      isAdmin,
      classProfessorId: classEntity.professorId,
      membersCount: classEntity.members.length,
      memberIds: classEntity.members.map(m => m.studentId)
    });
    
    if (isStudent) {
      const isMember = classEntity.members.some(m => m.studentId === user.id);
      console.log('🔍 getClassById - Student check:', { isMember, studentId: user.id });
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this class');
      }
    } else if (isProfessor && classEntity.professorId !== user.id && !isAdmin) {
      throw new ForbiddenException('You are not the professor of this class');
    }

    return classEntity;
  }

  async joinClass(student: { id: number; role: Role }, invitationCode: string) {
    const roleString = typeof student.role === 'string' ? student.role.toUpperCase() : student.role;
    if (roleString !== Role.STUDENT && roleString !== 'STUDENT') {
      throw new ForbiddenException('Only students can join classes');
    }

    const studentId = Number(student.id);
    if (!student.id || Number.isNaN(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    const code = String(invitationCode || '').trim().toUpperCase();
    if (!code) {
      throw new BadRequestException('Invitation code is required');
    }

    const classEntity = await this.prisma.class.findUnique({
      where: { invitationCode: code }
    });

    if (!classEntity) {
      throw new NotFoundException('Invalid invitation code');
    }

    if (!classEntity.isActive) {
      throw new BadRequestException('This class is no longer active');
    }

    // Check if already a member
    const existing = await this.prisma.classMember.findUnique({
      where: {
        classId_studentId: {
          classId: classEntity.id,
          studentId
        }
      }
    });

    if (existing) {
      throw new BadRequestException('You are already a member of this class');
    }

    return this.prisma.classMember.create({
      data: {
        classId: classEntity.id,
        studentId
      },
      include: {
        class: {
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
        }
      }
    });
  }

  async getMyJoinedClasses(student: { id: number; role: Role }) {
    // Normalize role pentru comparație (poate fi string sau enum)
    const roleString = typeof student.role === 'string' ? student.role.toUpperCase() : student.role;
    if (roleString !== Role.STUDENT && roleString !== 'STUDENT') {
      console.error('❌ getMyJoinedClasses - Invalid role:', { 
        studentRole: student.role, 
        roleString, 
        studentId: student.id 
      });
      throw new ForbiddenException('Only students can view joined classes');
    }

    // Verifică dacă student.id este valid
    if (!student.id || isNaN(Number(student.id))) {
      console.error('❌ getMyJoinedClasses - Invalid student ID:', student);
      throw new BadRequestException('Invalid student ID');
    }

    const studentId = Number(student.id);
    
    console.log('🔍 getMyJoinedClasses - Querying memberships for student:', studentId);

    try {
      const memberships = await this.prisma.classMember.findMany({
        where: { 
          studentId: studentId
        },
        include: {
          class: {
            include: {
              professor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              _count: {
                select: {
                  members: true,
                  announcements: true,
                  assignments: true
                }
              }
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      });
      
      console.log('✅ getMyJoinedClasses - Found memberships:', memberships.length);
      
      // Filtrează doar clasele active după ce le-am primit
      const activeMemberships = memberships.filter(m => m.class && m.class.isActive);
      
      // Returnează doar clasele (fără wrapper-ul membership)
      const classes = activeMemberships
        .map(m => m.class)
        .filter(c => c !== null && c.isActive); // Filtru suplimentar pentru siguranță
      
      console.log('📚 getMyJoinedClasses:', {
        studentId: student.id,
        membershipsCount: memberships.length,
        activeMembershipsCount: activeMemberships.length,
        classesCount: classes.length,
        classes: classes.map(c => ({ id: c.id, name: c.name, isActive: c.isActive }))
      });
      
      return classes;
    } catch (error) {
      console.error('❌ getMyJoinedClasses - Prisma error:', error);
      throw error;
    }
  }

  async regenerateInvitationCode(professor: { id: number; role: Role }, classId: number) {
    this.ensureProfessor(professor);

    const classEntity = await this.prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    if (classEntity.professorId !== professor.id && professor.role !== Role.ADMIN) {
      throw new ForbiddenException('You are not the professor of this class');
    }

    // Generate new unique code
    let invitationCode = this.generateInvitationCode();
    let exists = await this.prisma.class.findUnique({ where: { invitationCode } });
    while (exists) {
      invitationCode = this.generateInvitationCode();
      exists = await this.prisma.class.findUnique({ where: { invitationCode } });
    }

    return this.prisma.class.update({
      where: { id: classId },
      data: { invitationCode }
    });
  }
}


