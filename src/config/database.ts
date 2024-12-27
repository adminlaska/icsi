import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Debug-Ausgabe
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

console.log('Versuche Verbindung mit:', {
  ...dbConfig,
  password: '***' // Passwort ausgeblendet
});

export const pool = new Pool(dbConfig);

// Verbindungstest
pool.connect()
  .then(client => {
    console.log('Datenbankverbindung erfolgreich');
    client.release();
  })
  .catch(err => {
    console.error('DB Fehler:', err.message);
  }); 