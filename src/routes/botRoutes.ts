import { Router } from 'express';
import { pool } from '../config/database';

const router = Router();

// Bot-Antwort Route
router.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body;

  try {
    // Suche nach passender Frage in der Datenbank
    const result = await pool.query(`
      SELECT 
        q.id,
        q.question,
        q.type,
        json_agg(
          json_build_object(
            'id', a.id,
            'answer_text', a.answer_text,
            'is_correct', a.is_correct
          )
        ) as answers
      FROM questions q
      LEFT JOIN answers a ON q.id = a.question_id
      WHERE q.question ILIKE $1
      GROUP BY q.id, q.question, q.type
      LIMIT 1
    `, [`%${message}%`]);

    if (result.rows.length > 0) {
      // Wenn eine passende Frage gefunden wurde
      const question = result.rows[0];
      res.json({
        type: 'button_response',
        message: question.question,
        options: question.answers.map((a: any) => ({
          text: a.answer_text,
          correct: a.is_correct
        }))
      });
    } else {
      // Wenn keine passende Frage gefunden wurde
      res.json({
        type: 'text_response',
        message: 'Entschuldigung, ich habe keine passende Antwort gefunden. Können Sie Ihre Frage anders formulieren?'
      });
    }

  } catch (error) {
    console.error('Chat-Fehler:', error);
    res.status(500).json({ 
      error: 'Ein Fehler ist aufgetreten',
      message: 'Bitte versuchen Sie es später erneut.'
    });
  }
});

// Antwort-Feedback Route
router.post('/feedback', async (req, res) => {
  const { questionId, answerId, wasHelpful } = req.body;

  try {
    await pool.query(`
      INSERT INTO feedback (question_id, answer_id, was_helpful, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [questionId, answerId, wasHelpful]);

    res.json({ message: 'Feedback erfolgreich gespeichert' });
  } catch (error) {
    console.error('Feedback-Fehler:', error);
    res.status(500).json({ error: 'Fehler beim Speichern des Feedbacks' });
  }
});

export default router; 