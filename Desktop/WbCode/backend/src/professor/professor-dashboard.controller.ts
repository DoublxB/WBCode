import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ProfessorDashboardService } from './professor-dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('professor')
export class ProfessorDashboardController {
  constructor(private readonly dashboard: ProfessorDashboardService) {}

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Get('dashboard')
  summary(@CurrentUser() user: any) {
    return this.dashboard.getDashboard(user);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Get('reports/export')
  async export(
    @CurrentUser() user: any,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
    @Res() res: Response
  ) {
    const result = await this.dashboard.exportProgressReport(user, format);
    res.setHeader('Content-Type', result.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }
}



