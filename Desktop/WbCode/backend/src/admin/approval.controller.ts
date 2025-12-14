import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/approvals')
export class ApprovalController {
  constructor(private readonly approval: ApprovalService) {}

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Post('submit')
  submitForApproval(
    @CurrentUser() user: any,
    @Body() dto: { contentType: 'LESSON' | 'QUIZ' | 'CODING_EXERCISE'; contentId: number }
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.approval.submitForApproval(userObj, dto.contentType, dto.contentId);
  }

  @Roles(Role.ADMIN)
  @Get('pending')
  listPendingApprovals(@CurrentUser() user: any) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.approval.listPendingApprovals(userObj);
  }

  @Roles(Role.ADMIN)
  @Post(':id/review')
  reviewApproval(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { status: 'APPROVED' | 'REJECTED' | 'REVISIONS_REQUESTED'; adminNotes?: string }
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.approval.reviewApproval(userObj, id, dto.status, dto.adminNotes);
  }

  @Roles(Role.PROFESSOR)
  @Get('my-submissions')
  getMySubmissions(@CurrentUser() user: any) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.approval.getMySubmissions(userObj);
  }
}


