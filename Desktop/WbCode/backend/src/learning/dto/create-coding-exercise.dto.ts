import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsOptional()
  @IsString()
  hint?: string; // Hint personalizat pentru problemă (în română)

  @IsOptional()
  testCases?: any; // Array of test cases: [{input?: string, stdin?: string, output: string}]
}

export class SubmitCodeDto {
  @IsString()
  sourceCode!: string;

  @IsOptional()
  @IsString()
  stdin?: string;

  @IsOptional()
  @IsNumber()
  typingSpeed?: number; // caractere pe secundă

  @IsOptional()
  @IsNumber()
  timeSpent?: number; // timpul total în secunde

  @IsOptional()
  @IsBoolean()
  hasLargePaste?: boolean; // dacă s-a făcut un paste mare (>50 caractere)

  @IsOptional()
  @IsNumber()
  largestPasteSize?: number; // dimensiunea celui mai mare paste
}












