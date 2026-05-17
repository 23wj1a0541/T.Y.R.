export type InterviewQuestionType =
  | "behavioral"
  | "technical"
  | "situational"
  | "general";

export type InterviewQuestionDifficulty = "easy" | "medium" | "hard";

export type InterviewQuestion = {
  id: string;
  question: string;
  type: InterviewQuestionType;
  difficulty: InterviewQuestionDifficulty;
  why_asked: string;
  star_tips: string;
  sample_answer_outline: string;
};
