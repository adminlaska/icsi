import express, { RequestHandler } from 'express';
import { pool } from '../config/database';

const router = express.Router();

// Handler-Funktionen
const getSuppliers: RequestHandler = async (req, res, next) => {
    try {
        console.log('Fetching suppliers...');

        const result = await pool.query(`
            WITH supplier_questions AS (
                SELECT DISTINCT ON (s.id, m.name, et.name, q.id)
                    s.id as supplier_id,
                    s.name as supplier_name,
                    m.name as market_type,
                    et.name as energy_type,
                    array_agg(DISTINCT mt.name) FILTER (WHERE mt.name IS NOT NULL) as measurement_types,
                    q.id as question_id,
                    CASE 
                        WHEN et.name = 'gas' THEN REPLACE(q.question, 'Strom', 'Gas')
                        ELSE q.question
                    END as question,
                    qc.name as category
                FROM suppliers s
                LEFT JOIN supplier_energy_types set2 ON s.id = set2.supplier_id
                LEFT JOIN energy_types et ON set2.energy_type_id = et.id
                LEFT JOIN supplier_measurement_types smt ON s.id = smt.supplier_id
                LEFT JOIN measurement_types mt ON smt.measurement_type_id = mt.id
                JOIN questions q ON s.id = q.supplier_id
                JOIN market_types m ON q.market_type_id = m.id
                JOIN question_categories qc ON q.category_id = qc.id
                GROUP BY s.id, s.name, m.name, et.name, q.id, q.question, qc.name
            )
            SELECT 
                sq.supplier_name as name,
                sq.market_type,
                ARRAY[sq.energy_type] as energy_types,
                sq.measurement_types,
                sq.question_id as id,
                sq.question,
                sq.category,
                (
                    SELECT json_agg(
                        json_build_object(
                            'answer_text', 
                            CASE 
                                WHEN sq.energy_type = 'gas' THEN REPLACE(a.answer_text, 'Strom', 'Gas')
                                ELSE a.answer_text
                            END,
                            'is_correct', a.is_correct
                        )
                    )
                    FROM answers a
                    WHERE a.question_id = sq.question_id
                ) as answers
            FROM supplier_questions sq
            ORDER BY sq.supplier_name, sq.market_type, sq.energy_type
        `);

        console.log('Query result:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getSuppliers:', error);
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

interface SupplierData {
    name: string;
    market_type: string;
    energy_types: string[];
    measurement_types: string[];
    category: string;
}

const createSupplier: RequestHandler = async (req, res, next) => {
    const client = await pool.connect();
    
    try {
        const data: SupplierData = req.body;
        
        await client.query('BEGIN');

        // Lieferanten einfügen
        const supplierResult = await client.query(
            `INSERT INTO suppliers (name, market_type, category)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [data.name, data.market_type, data.category]
        );
        
        const supplierId = supplierResult.rows[0].id;

        // Energietypen verknüpfen
        for (const energyType of data.energy_types) {
            await client.query(
                `INSERT INTO supplier_energy_types (supplier_id, energy_type)
                 VALUES ($1, $2)`,
                [supplierId, energyType]
            );
        }

        // Messtypen verknüpfen
        for (const measurementType of data.measurement_types) {
            await client.query(
                `INSERT INTO supplier_measurement_types (supplier_id, measurement_type)
                 VALUES ($1, $2)`,
                [supplierId, measurementType]
            );
        }

        await client.query('COMMIT');
        
        res.status(201).json({
            message: 'Lieferant erfolgreich erstellt',
            supplierId,
            name: data.name
        });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

// Router-Konfiguration
router.get('/', getSuppliers);
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.post('/questions', createQuestion);
router.post('/supplier', createSupplier);

export default router;
