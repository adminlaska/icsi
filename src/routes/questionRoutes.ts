import { Router } from 'express';
import { pool } from '../config/database';
import { Request, Response } from 'express';

const router = Router();

// GET alle Fragen
router.get('/', async (req: Request, res: Response) => {
    try {
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
            GROUP BY q.id
            ORDER BY q.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST neue Frage
router.post('/', async (req: Request, res: Response) => {
    const { question, type, answer } = req.body;

    try {
        // Frage einfügen
        const questionResult = await pool.query(
            'INSERT INTO questions (question, type) VALUES ($1, $2) RETURNING id',
            [question, type]
        );

        // Antwort einfügen
        await pool.query(
            'INSERT INTO answers (question_id, answer_text) VALUES ($1, $2)',
            [questionResult.rows[0].id, answer]
        );

        res.status(201).json({ message: 'Frage erfolgreich erstellt' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE Frage
router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        // Zuerst die zugehörigen Antworten löschen
        await pool.query('DELETE FROM answers WHERE question_id = $1', [id]);
        // Dann die Frage löschen
        await pool.query('DELETE FROM questions WHERE id = $1', [id]);

        res.json({ message: 'Frage erfolgreich gelöscht' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router; 