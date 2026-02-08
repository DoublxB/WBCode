import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Post()
  createClass(
    @CurrentUser() user: any,
    @Body() dto: { name: string; description?: string; usesRoadmap?: boolean }
  ) {
    // Transform JWT payload to expected format
    const professor = {
      id: Number(user.sub || user.id),
      role: user.role || user.role?.name
    };
    return this.classes.createClass(professor, dto.name, dto.description, Boolean(dto?.usesRoadmap));
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Get('my-classes')
  getMyClasses(@CurrentUser() user: any) {
    return this.classes.getMyClasses(user);
  }

  @Roles(Role.STUDENT)
  @Get('my-joined-classes')
  getMyJoinedClasses(@CurrentUser() user: any) {
    // Transform JWT payload to expected format
    const userId = user.sub || user.id;
    if (!userId) {
      console.error('❌ getMyJoinedClasses - User ID not found:', user);
      throw new BadRequestException('User ID not found in token');
    }
    
    const roleString = user.role || user.role?.name;
    const normalizedRole = typeof roleString === 'string' ? roleString.toUpperCase() : roleString;
    
    if (!normalizedRole || normalizedRole !== 'STUDENT') {
      console.error('❌ getMyJoinedClasses - Invalid role:', { roleString, normalizedRole, user });
      throw new BadRequestException(`Invalid role: ${normalizedRole}. Expected STUDENT.`);
    }
    
    const student = {
      id: Number(userId),
      role: normalizedRole as Role
    };
    
    console.log('🔍 getMyJoinedClasses - Controller:', {
      userRaw: user,
      studentTransformed: student,
      roleString,
      normalizedRole,
      userId
    });
    
    return this.classes.getMyJoinedClasses(student);
  }

  @Roles(Role.STUDENT)
  @Post('join')
  joinClass(@CurrentUser() user: any, @Body() dto: { invitationCode: string }) {
    const userIdRaw = user?.sub ?? user?.id;
    const userId = Number(userIdRaw);
    if (!userIdRaw || Number.isNaN(userId)) {
      console.error('❌ joinClass - User ID not found/invalid:', { userRaw: user, userIdRaw });
      throw new BadRequestException('User ID not found in token');
    }

    const roleString = user?.role || user?.role?.name;
    const normalizedRole = typeof roleString === 'string' ? roleString.toUpperCase() : roleString;
    if (normalizedRole !== Role.STUDENT && normalizedRole !== 'STUDENT') {
      console.error('❌ joinClass - Invalid role:', { roleString, normalizedRole, userRaw: user });
      throw new BadRequestException(`Invalid role: ${normalizedRole}. Expected STUDENT.`);
    }

    const invitationCode = String(dto?.invitationCode || '').trim().toUpperCase();
    if (!invitationCode) {
      throw new BadRequestException('Invitation code is required');
    }

    const student = { id: userId, role: Role.STUDENT };
    return this.classes.joinClass(student, invitationCode);
  }

  @Get(':id')
  getClassById(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    // Transform JWT payload to expected format
    const userId = user.sub || user.id;
    const roleString = user.role || user.role?.name;
    const normalizedRole = typeof roleString === 'string' ? roleString.toUpperCase() : roleString;
    
    const userObj = {
      id: Number(userId),
      role: normalizedRole as Role
    };
    
    console.log('🔍 getClassById - Controller:', {
      userRaw: user,
      userTransformed: userObj,
      classId: id
    });
    
    return this.classes.getClassById(id, userObj);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Post(':id/regenerate-code')
  regenerateInvitationCode(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.classes.regenerateInvitationCode(user, id);
  }
}


