import { pool } from '../pool';

async function seedCategories() {
    try {
        await pool.query(`
            INSERT INTO categories (name) VALUES 
            ('Standard'),
            ('Premium'),
            ('Enterprise')
            ON CONFLICT (name) DO NOTHING;
        `);
        
        console.log('Categories seeded successfully');
    } catch (error) {
        console.error('Error seeding categories:', error);
    }
}

export default seedCategories;