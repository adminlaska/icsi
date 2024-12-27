import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './config/database';
import chatRoutes from './routes/chatRoutes';
import botRoutes from './routes/botRoutes';
import supplierRoutes from './routes/supplierRoutes';
import questionRoutes from './routes/questionRoutes';
import categoryRoutes from './routes/categoryRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', chatRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
  console.log('Verfügbare Endpunkte:');
  console.log(`- GET    http://localhost:${port}/api/questions`);
  console.log(`- POST   http://localhost:${port}/api/questions`);
  console.log(`- DELETE http://localhost:${port}/api/questions/:id`);
  console.log(`- POST   http://localhost:${port}/api/bot/chat`);
  console.log(`- GET    http://localhost:${port}/api/suppliers`);
}).on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} ist bereits in Verwendung.`);
    console.error('Bitte beenden Sie alle node-Prozesse und versuchen Sie es erneut.');
  } else {
    console.error('Server-Fehler:', error.message);
  }
  process.exit(1);
});