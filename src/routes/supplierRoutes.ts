import { Router } from 'express';
import { pool } from '../db/pool';

const router = Router();

interface Supplier {
    id: number;
    name: string;
    market_type: string;
    energy_types: string[];
    measurement_types: string[];
}

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.id,
                s.name,
                s.market_type,
                ARRAY_AGG(DISTINCT e.name) FILTER (WHERE e.name IS NOT NULL) AS energy_types,
                ARRAY_AGG(DISTINCT m.name) FILTER (WHERE m.name IS NOT NULL) AS measurement_types
            FROM suppliers s
            LEFT JOIN supplier_energy_types set ON s.id = set.supplier_id
            LEFT JOIN energy_types e ON set.energy_type_id = e.id
            LEFT JOIN supplier_measurement_types smt ON s.id = smt.supplier_id
            LEFT JOIN measurement_types m ON smt.measurement_type_id = m.id
            GROUP BY s.id, s.name, s.market_type
            ORDER BY s.name;
        `);

        console.log('Database query result:', result.rows);

        if (!result.rows) {
            throw new Error('No data returned from database');
        }

        const suppliers: Supplier[] = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            market_type: row.market_type || '',
            energy_types: Array.isArray(row.energy_types) ? row.energy_types : [],
            measurement_types: Array.isArray(row.measurement_types) ? row.measurement_types : []
        }));

        console.log('Processed suppliers:', suppliers);

        res.json({ suppliers: suppliers });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
