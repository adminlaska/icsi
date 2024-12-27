import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database';
import chatRoutes from './routes/chatRoutes';
import botRoutes from './routes/botRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3030;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', chatRoutes);
app.use('/api/bot', botRoutes);

// Einfacher Health-Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Verbesserte Fehlerbehandlung
app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
  console.log('Verfügbare Endpunkte:');
  console.log(`- GET    http://localhost:${port}/api/questions`);
  console.log(`- POST   http://localhost:${port}/api/questions`);
  console.log(`- DELETE http://localhost:${port}/api/questions/:id`);
  console.log(`- POST   http://localhost:${port}/api/bot/chat`);
}).on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} ist bereits in Verwendung.`);
    console.error('Bitte beenden Sie alle node-Prozesse und versuchen Sie es erneut.');
  } else {
    console.error('Server-Fehler:', error.message);
  }
  process.exit(1);
});