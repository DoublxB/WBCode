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

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateQuizDto) {
    return this.quizzes.createQuiz(user, dto);
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



