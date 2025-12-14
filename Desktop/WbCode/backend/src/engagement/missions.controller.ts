import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMissionDto, MissionProgressDto } from './dto/create-mission.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('missions')
export class MissionsController {
  constructor(private readonly missions: MissionsService) {}

  @Get()
  list() {
    return this.missions.listActiveMissions();
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateMissionDto) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.missions.createMission(userObj, dto);
  }

  @Post(':id/join')
  join(@CurrentUser('sub') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.missions.joinMission(userId, id);
  }

  @Post(':id/progress')
  progress(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MissionProgressDto
  ) {
    return this.missions.submitProgress(userId, id, dto);
  }
}




