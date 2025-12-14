import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class QuizQuestionDto {
  @IsString()
  prompt!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsString()
  answerKey!: string;

  @IsString()
  explanation!: string;
}

export class CreateQuizDto {
  @IsInt()
  lessonId!: number;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  timeLimit!: number;

  @IsArray()
  @ArrayMinSize(1)
  questions!: QuizQuestionDto[];
}












