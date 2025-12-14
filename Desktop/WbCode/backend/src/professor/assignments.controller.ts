import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes/:classId/assignments')
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Post()
  createAssignment(
    @CurrentUser() user: any,
    @Param('classId', ParseIntPipe) classId: number,
    @Body() dto: {
      title: string;
      description: string;
      type: 'PROBLEM' | 'HOMEWORK' | 'MATERIAL';
      difficulty: string;
      contentId?: number;
      contentType?: 'LESSON' | 'QUIZ' | 'CODING_EXERCISE';
      dueDate?: string;
    }
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.assignments.createAssignment(
      userObj,
      classId,
      dto.title,
      dto.description,
      dto.type,
      dto.difficulty,
      dto.contentId,
      dto.contentType,
      dto.dueDate ? new Date(dto.dueDate) : undefined
    );
  }

  @Get()
  getClassAssignments(
    @CurrentUser() user: any,
    @Param('classId', ParseIntPipe) classId: number
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.assignments.getClassAssignments(classId, userObj);
  }

  @Roles(Role.STUDENT)
  @Post(':assignmentId/submit')
  submitAssignment(
    @CurrentUser() user: any,
    @Param('classId', ParseIntPipe) classId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() dto: { submissionId: number }
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.assignments.submitAssignment(userObj, assignmentId, dto.submissionId);
  }

  @Get(':assignmentId')
  getAssignmentById(
    @CurrentUser() user: any,
    @Param('classId', ParseIntPipe) classId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number
  ) {
    const userObj = {
      id: Number(user.sub || user.id),
      role: (user.role || user.role?.name) as Role
    };
    return this.assignments.getAssignmentById(classId, assignmentId, userObj);
  }
}

