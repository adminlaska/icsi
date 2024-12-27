import { Router } from 'express';
import { pool } from '../db/pool';
import { RequestHandler } from 'express';

const router = Router();

const getCategories: RequestHandler = async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT id, name 
            FROM question_categories 
            ORDER BY name ASC
        `);
        
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

router.get('/', getCategories);

export default router; 