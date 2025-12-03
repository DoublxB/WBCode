import { IsDateString, IsEnum, IsInt, IsString, Min } from 'class-validator';

export enum MissionGoalType {
  QUIZZES = 'QUIZZES',
  CODING = 'CODING',
  XP = 'XP'
}

export class CreateMissionDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsEnum(MissionGoalType)
  goalType!: MissionGoalType;

  @IsInt()
  @Min(1)
  goalValue!: number;

  @IsInt()
  @Min(10)
  rewardXP!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}

export class MissionProgressDto {
  @IsInt()
  @Min(1)
  progress!: number;
}



