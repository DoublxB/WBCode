import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AssignmentApprovalService } from './assignment-approval.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/assignments')
export class AssignmentApprovalController {
  constructor(private readonly approval: AssignmentApprovalService) {}

  @Roles(Role.ADMIN)
  @Get('pending')
  listPendingAssignments(@CurrentUser() user: any) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.approval.listPendingAssignments(userObj);
  }

  @Roles(Role.ADMIN)
  @Post(':id/review')
  reviewAssignment(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { status: 'APPROVED' | 'REJECTED'; adminNotes?: string }
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.approval.reviewAssignment(userObj, id, dto.status, dto.adminNotes);
  }
}


