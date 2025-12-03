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
    return this.lessons.createLesson(user, dto);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any, @Body() dto: UpdateLessonDto) {
    return this.lessons.updateLesson(id, user, dto);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.lessons.deleteLesson(id, user);
  }
}



