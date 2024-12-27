export interface Question {
  id?: number;
  question: string;
  type: 'button' | 'text';
  created_at?: Date;
}

export interface Answer {
  id?: number;
  question_id: number;
  answer_text: string;
  is_correct: boolean;
} 