import { ArrayMinSize, IsArray, IsInt, IsString } from 'class-validator';

export class SubmitQuizAnswerDto {
  @IsInt()
  questionId!: number;

  @IsString()
  answer!: string;
}

export class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  answers!: SubmitQuizAnswerDto[];
}












