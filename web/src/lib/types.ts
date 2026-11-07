export type Difficulty = "easy" | "medium" | "hard";

export type QTable = Record<Difficulty, Record<Difficulty, number>>;

export type QuestionItem = {
  question: string;
  expected: string;
  hints: string;
};

export type GradeResult = {
  correct: boolean;
  feedback: string;
  correction: string;
};

export type RoundResult = {
  round: number;
  difficulty: Difficulty;
  question: string;
  answer: string;
  correct: boolean;
  reward: number;
  feedback: string;
  correction: string;
};

export type SessionConfig = {
  language: string;
  topic: string;
  rounds: number;
};
