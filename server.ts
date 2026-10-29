import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { parseReceiptImageWithAI } from './src/server/receiptParser';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CleanSlate Bankruptcy API' });
});

// AI Receipt parsing endpoint
app.post('/api/parse-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 parameter is required' });
    }

    const result = await parseReceiptImageWithAI(imageBase64, mimeType);
    return res.json(result);
  } catch (error: any) {
    console.error('Server error in /api/parse-receipt:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CleanSlate server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start when invoked directly
if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  start();
}

export { app, start };
