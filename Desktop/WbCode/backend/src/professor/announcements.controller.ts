import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classes/:classId/announcements')
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Post()
  createAnnouncement(
    @CurrentUser() user: any,
    @Param('classId', ParseIntPipe) classId: number,
    @Body() dto: { title: string; content: string }
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.announcements.createAnnouncement(userObj, classId, dto.title, dto.content);
  }

  @Get()
  getClassAnnouncements(
    @CurrentUser() user: any,
    @Param('classId', ParseIntPipe) classId: number
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.announcements.getClassAnnouncements(classId, userObj);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Delete(':id')
  deleteAnnouncement(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number
  ) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.announcements.deleteAnnouncement(userObj, id);
  }
}


