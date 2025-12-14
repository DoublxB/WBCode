import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CodingService } from './coding.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCodingExerciseDto, SubmitCodeDto } from './dto/create-coding-exercise.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('coding')
export class CodingController {
  constructor(private readonly coding: CodingService) {}

  @Get()
  list() {
    return this.coding.listExercises();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.coding.getExercise(id);
  }

  @Roles(Role.PROFESSOR, Role.ADMIN)
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateCodingExerciseDto) {
    const userObj = {
      id: user.sub || user.id,
      role: user.role || user.role?.name
    };
    return this.coding.createExercise(userObj, dto);
  }

  @Post(':id/submit')
  submit(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitCodeDto
  ) {
    return this.coding.submit(userId, id, dto);
  }
}




