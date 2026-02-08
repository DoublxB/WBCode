import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProfessorAnalyticsService } from './professor-analytics.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('professor/analytics')
export class ProfessorAnalyticsController {
  constructor(private readonly analytics: ProfessorAnalyticsService) {}

  private userObj(user: any) {
    return {
      id: Number(user?.sub ?? user?.id),
      role: (user?.role ?? user?.role?.name) as Role
    };
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Get('classes/:classId/summary')
  getClassSummary(
    @CurrentUser() user: any,
    @Param('classId') classIdRaw: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const classId = Number(classIdRaw);
    return this.analytics.getClassSummary(this.userObj(user), classId, from, to);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Get('classes/:classId/leaderboard')
  getClassLeaderboard(
    @CurrentUser() user: any,
    @Param('classId') classIdRaw: string,
    @Query('metric') metric?: 'xpGain' | 'xpTotal' | 'solved',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string
  ) {
    const classId = Number(classIdRaw);
    return this.analytics.getClassLeaderboard(this.userObj(user), classId, metric || 'xpGain', from, to, Number(limit || 25));
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Get('classes/:classId/timeseries')
  getClassTimeseries(
    @CurrentUser() user: any,
    @Param('classId') classIdRaw: string,
    @Query('metric') metric?: 'submissions' | 'activeStudents' | 'xpGain',
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const classId = Number(classIdRaw);
    return this.analytics.getClassTimeseries(this.userObj(user), classId, metric || 'submissions', from, to);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Get('classes/:classId/students')
  getClassStudentsTable(
    @CurrentUser() user: any,
    @Param('classId') classIdRaw: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const classId = Number(classIdRaw);
    return this.analytics.getClassStudentsTable(this.userObj(user), classId, from, to);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Get('classes/:classId/risks')
  getClassRisks(
    @CurrentUser() user: any,
    @Param('classId') classIdRaw: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const classId = Number(classIdRaw);
    return this.analytics.getClassRisks(this.userObj(user), classId, from, to);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Get('classes/:classId/modules')
  getClassModules(
    @CurrentUser() user: any,
    @Param('classId') classIdRaw: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const classId = Number(classIdRaw);
    return this.analytics.getClassModuleDistribution(this.userObj(user), classId, from, to);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Get('classes/:classId/export')
  async exportClassCsv(
    @CurrentUser() user: any,
    @Param('classId') classIdRaw: string,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const classId = Number(classIdRaw);
    const result = await this.analytics.exportClassCsv(this.userObj(user), classId, from, to);
    res.setHeader('Content-Type', result.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }
}


