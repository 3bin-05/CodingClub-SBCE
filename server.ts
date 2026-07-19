import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = path.resolve('data/db.json');
const UPLOADS_DIR = path.resolve('data/uploads');

// Ensure directories exist
async function ensureDirs() {
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating data directories:', err);
  }
}

// Read database
async function readDb() {
  try {
    if (!existsSync(DB_PATH)) {
      return null;
    }
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database, using fallback:', err);
    return null;
  }
}

// Write database
async function writeDb(data: any) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

async function startServer() {
  await ensureDirs();

  const app = express();
  
  // Increase payload limit for base64 image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Static serving of uploaded files
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Authentication validation middleware helper
  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    if (token !== 'admin-session-sbce-coding-club') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    next();
  };

  // --- API ROUTES REMOVED (MIGRATED TO FIREBASE) ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', migrated: true });
  });



  // --- SERVING ASSETS & ROUTING ---

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    // Development Mode: Vite runs programmatically
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CSE SBCE Coding Club platform server is active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot failure:', err);
});
