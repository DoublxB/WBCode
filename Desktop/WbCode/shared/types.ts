export type Role = 'STUDENT' | 'PROFESSOR' | 'ADMIN';

export interface Lesson {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
}

export interface QuizQuestion {
  id: number;
  prompt: string;
  options: string[];
  answerKey: string;
  explanation: string;
}

export interface CodingExercise {
  id: number;
  title: string;
  prompt: string;
  starterCode: string;
  language: 'C' | 'CPP' | 'PYTHON';
}



