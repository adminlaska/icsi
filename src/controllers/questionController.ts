import { Request, Response } from 'express';
import { pool } from '../config/database';
import { Question, Answer } from '../models/Question';

export class QuestionController {
  async createQuestion(req: Request, res: Response) {
    try {
      const { question, type, answers }: { question: string; type: string; answers: string[] } = req.body;

      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Frage einfügen
        const questionResult = await client.query(
          'INSERT INTO questions (question, type) VALUES ($1, $2) RETURNING id',
          [question, type]
        );
        
        const questionId = questionResult.rows[0].id;
        
        // Antworten einfügen
        for (const answer of answers) {
          await client.query(
            'INSERT INTO answers (question_id, answer_text, is_correct) VALUES ($1, $2, $3)',
            [questionId, answer, true]
          );
        }
        
        await client.query('COMMIT');
        
        res.status(201).json({
          message: 'Frage und Antworten erfolgreich erstellt',
          questionId
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Frage:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }

  async getQuestions(req: Request, res: Response) {
    try {
      const result = await pool.query('SELECT * FROM questions ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Fehler beim Abrufen der Fragen:', error);
      res.status(500).json({ error: 'Interner Serverfehler' });
    }
  }
} 