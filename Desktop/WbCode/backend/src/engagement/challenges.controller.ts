import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubmitCodeDto } from '../learning/dto/create-coding-exercise.dto';
import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';

class CreateChallengeDto {
  @IsInt()
  opponentId!: number;

  @IsOptional()
  @IsInt()
  codingExerciseId?: number; // Optional - if not provided, will use category

  @IsOptional()
  @IsString()
  category?: string; // Category for random selection

  @IsOptional()
  @IsIn(['RANDOM', 'SPECIFIC', 'AUTO'])
  mode?: 'RANDOM' | 'SPECIFIC' | 'AUTO'; // Challenge mode (AUTO = system picks any random problem)
}

@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  @Get()
  list(@CurrentUser('sub') userId: number) {
    return this.challenges.listChallenges(userId);
  }

  @Post()
  create(@CurrentUser('sub') userId: number, @Body() dto: CreateChallengeDto) {
    return this.challenges.createChallenge(userId, dto);
  }

  @Post(':id/accept')
  accept(@CurrentUser('sub') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.challenges.acceptChallenge(userId, id);
  }

  @Post(':id/submit')
  submit(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitCodeDto
  ) {
    return this.challenges.submitChallengeCode(userId, id, dto);
  }
}

