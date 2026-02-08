import { ActivityEventType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional } from 'class-validator';

export class CreateActivityEventDto {
  @IsEnum(ActivityEventType)
  type!: ActivityEventType;

  @IsOptional()
  @IsInt()
  codingId?: number;

  @IsOptional()
  @IsInt()
  quizId?: number;

  @IsOptional()
  @IsInt()
  missionId?: number;

  // Keep metadata flexible; validate loosely
  @IsOptional()
  metadata?: any;
}





