import express, { RequestHandler } from 'express';
import { pool } from '../config/database';

const router = express.Router();

// Handler-Funktionen
const getSuppliers: RequestHandler = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.name,
                m.name as market_type,
                q.id,
                q.question,
                qc.name as category,
                json_agg(
                    json_build_object(
                        'answer_text', a.answer_text,
                        'is_correct', a.is_correct
                    )
                ) as answers
            FROM suppliers s
            JOIN questions q ON s.id = q.supplier_id
            JOIN market_types m ON q.market_type_id = m.id
            JOIN question_categories qc ON q.category_id = qc.id
            JOIN answers a ON q.id = a.question_id
            GROUP BY s.name, m.name, q.id, q.question, qc.name
            ORDER BY s.name, m.name, q.id
        `);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

const getCategories: RequestHandler = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT * FROM question_categories ORDER BY name'
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

const createCategory: RequestHandler = async (req, res, next) => {
    const { name } = req.body;

    try {
        const existingCategory = await pool.query(
            'SELECT id FROM question_categories WHERE name = $1',
            [name]
        );

        if (existingCategory.rows.length > 0) {
            res.status(400).json({ error: 'Kategorie existiert bereits' });
            return;
        }

        await pool.query(
            'INSERT INTO question_categories (name) VALUES ($1)',
            [name]
        );

        res.status(201).json({ message: 'Kategorie erfolgreich hinzugefügt' });
    } catch (error) {
        next(error);
    }
};

const createQuestion: RequestHandler = async (req, res, next) => {
    const { supplier_name, market_type, category, question, answer } = req.body;

    try {
        const supplierResult = await pool.query(
            'SELECT id FROM suppliers WHERE name = $1',
            [supplier_name]
        );
        const categoryResult = await pool.query(
            'SELECT id FROM question_categories WHERE name = $1',
            [category]
        );
        const marketTypeResult = await pool.query(
            'SELECT id FROM market_types WHERE name = $1',
            [market_type]
        );

        const questionResult = await pool.query(
            'INSERT INTO questions (supplier_id, market_type_id, category_id, question) VALUES ($1, $2, $3, $4) RETURNING id',
            [supplierResult.rows[0].id, marketTypeResult.rows[0].id, categoryResult.rows[0].id, question]
        );

        await pool.query(
            'INSERT INTO answers (question_id, answer_text, is_correct) VALUES ($1, $2, $3)',
            [questionResult.rows[0].id, answer, true]
        );

        res.status(201).json({ message: 'Frage erfolgreich hinzugefügt' });
    } catch (error) {
        next(error);
    }
};

// Router-Konfiguration
router.get('/', getSuppliers);
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.post('/questions', createQuestion);

export default router;
