import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Get()
  listQuizzes() {
    return this.quizzes.listQuizzes();
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateQuizDto) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.quizzes.createQuiz(userObj, dto);
  }

  @Get(':id')
  getQuiz(@Param('id', ParseIntPipe) id: number) {
    return this.quizzes.getQuiz(id);
  }

  @Post(':id/submit')
  submit(@CurrentUser('sub') userId: number, @Param('id', ParseIntPipe) id: number, @Body() dto: SubmitQuizDto) {
    return this.quizzes.submitQuiz(userId, id, dto);
  }
}



