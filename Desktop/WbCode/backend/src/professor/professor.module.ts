import { Module } from '@nestjs/common';
import { ProfessorDashboardController } from './professor-dashboard.controller';
import { ProfessorDashboardService } from './professor-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfessorDashboardController],
  providers: [ProfessorDashboardService]
})
export class ProfessorModule {}



