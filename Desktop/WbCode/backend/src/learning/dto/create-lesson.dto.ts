import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  content!: string;

  @IsString()
  difficulty!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

