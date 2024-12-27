import { Pool } from 'pg';

export const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'chatbot_db', // Ihr Datenbankname in pgAdmin 4
    password: 'IcsB2022', // Ihr PostgreSQL Passwort
    port: 5432,
}); 