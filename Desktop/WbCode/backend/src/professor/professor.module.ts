import { Module } from '@nestjs/common';
import { ProfessorDashboardController } from './professor-dashboard.controller';
import { ProfessorDashboardService } from './professor-dashboard.service';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProfessorDashboardController,
    ClassesController,
    AnnouncementsController,
    AssignmentsController
  ],
  providers: [
    ProfessorDashboardService,
    ClassesService,
    AnnouncementsService,
    AssignmentsService
  ],
  exports: [ClassesService, AnnouncementsService, AssignmentsService]
})
export class ProfessorModule {}



