import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get()
  list() {
    return this.lessons.listLessons();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.lessons.getLesson(id);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateLessonDto) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.lessons.createLesson(userObj, dto);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any, @Body() dto: UpdateLessonDto) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.lessons.updateLesson(id, userObj, dto);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.lessons.deleteLesson(id, userObj);
  }
}




