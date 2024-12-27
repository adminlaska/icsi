import { Router } from 'express';
import { pool } from '../config/database';

const router = Router();

// Alle Fragen abrufen
router.get('/questions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT q.id, q.question, q.type, 
             json_agg(json_build_object(
               'id', a.id,
               'answer_text', a.answer_text,
               'is_correct', a.is_correct
             )) as answers
      FROM questions q
      LEFT JOIN answers a ON q.id = a.question_id
      GROUP BY q.id, q.question, q.type
      ORDER BY q.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der Fragen:', error);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// Neue Frage erstellen
router.post('/questions', async (req, res) => {
  const { question, type, answers } = req.body;
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const questionResult = await client.query(
        'INSERT INTO questions (question, type) VALUES ($1, $2) RETURNING id',
        [question, type]
      );
      
      const questionId = questionResult.rows[0].id;
      
      for (const answer of answers) {
        await client.query(
          'INSERT INTO answers (question_id, answer_text, is_correct) VALUES ($1, $2, $3)',
          [questionId, answer.text, answer.is_correct]
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
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

// Frage löschen
router.delete('/questions/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM answers WHERE question_id = $1', [id]);
      await client.query('DELETE FROM questions WHERE id = $1', [id]);
      await client.query('COMMIT');
      
      res.json({ message: 'Frage und Antworten erfolgreich gelöscht' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    res.status(500).json({ error: 'Datenbankfehler' });
  }
});

export default router; 