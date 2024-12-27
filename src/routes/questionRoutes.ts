import { Router } from 'express';
import { pool } from '../db/pool';
import { RequestHandler } from 'express';

const router = Router();

interface QuestionData {
    supplier_id: number;
    category_id: number;
    energy_types: string[];
    measurement_types: string[];
    question: string;
    answers: Array<{
        text: string;
        is_correct: boolean;
    }>;
}

const createQuestion: RequestHandler = async (req, res, next) => {
    const client = await pool.connect();
    
    try {
        const data: QuestionData = req.body;
        
        await client.query('BEGIN');

        // 1. Frage einfügen
        const questionResult = await client.query(
            `INSERT INTO questions (supplier_id, category_id, question)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [data.supplier_id, data.category_id, data.question]
        );
        
        const questionId = questionResult.rows[0].id;

        // 2. Energietypen verknüpfen
        for (const energyType of data.energy_types) {
            await client.query(
                `INSERT INTO question_energy_types (question_id, energy_type)
                 VALUES ($1, $2)`,
                [questionId, energyType]
            );
        }

        // 3. Messtypen verknüpfen
        for (const measurementType of data.measurement_types) {
            await client.query(
                `INSERT INTO question_measurement_types (question_id, measurement_type)
                 VALUES ($1, $2)`,
                [questionId, measurementType]
            );
        }

        // 4. Antworten einfügen
        for (const answer of data.answers) {
            await client.query(
                `INSERT INTO answers (question_id, answer_text, is_correct)
                 VALUES ($1, $2, $3)`,
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
        next(error);
    } finally {
        client.release();
    }
};

const getQuestions: RequestHandler = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                q.id,
                q.question,
                q.supplier_id,
                s.name as supplier_name,
                q.category_id,
                qc.name as category_name,
                array_agg(DISTINCT qet.energy_type) as energy_types,
                array_agg(DISTINCT qmt.measurement_type) as measurement_types,
                json_agg(
                    json_build_object(
                        'id', a.id,
                        'text', a.answer_text,
                        'is_correct', a.is_correct
                    )
                ) as answers
            FROM questions q
            JOIN suppliers s ON q.supplier_id = s.id
            JOIN question_categories qc ON q.category_id = qc.id
            LEFT JOIN question_energy_types qet ON q.id = qet.question_id
            LEFT JOIN question_measurement_types qmt ON q.id = qmt.question_id
            LEFT JOIN answers a ON q.id = a.question_id
            GROUP BY q.id, q.question, q.supplier_id, s.name, q.category_id, qc.name
            ORDER BY q.id DESC
        `);

        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

router.post('/', createQuestion);
router.get('/', getQuestions);

export default router; 