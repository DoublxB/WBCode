import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export enum SupportedLanguage {
  C = 'C',
  CPP = 'CPP',
  PYTHON = 'PYTHON'
}

export class CreateCodingExerciseDto {
  @IsInt()
  lessonId!: number;

  @IsString()
  title!: string;

  @IsString()
  prompt!: string;

  @IsString()
  starterCode!: string;

  @IsString()
  difficulty!: string;

  @IsEnum(SupportedLanguage)
  language!: SupportedLanguage;

  @IsOptional()
  @IsString()
  inputSpec?: string;

  @IsOptional()
  @IsString()
  outputSpec?: string;
}

export class SubmitCodeDto {
  @IsString()
  sourceCode!: string;

  @IsOptional()
  @IsString()
  stdin?: string;
}



