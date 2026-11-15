import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { parseReceiptImageWithAI } from './src/server/receiptParser';

dotenv.config();

const app = express();
const PORT =
  process.env.NODE_ENV === 'production'
    ? parseInt(process.env.PORT || '3000', 10)
    : 3000;

app.use(express.json({ limit: '25mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CleanSlate Bankruptcy API' });
});

import { generateFinancialInsightWithAI } from './src/server/financialInsight';
import { processLitBotChatRequest } from './src/server/litbotChat';
import { getBotPenguinAgentConfig } from './src/server/botpenguinAgent';

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

// AI Financial Insight endpoint
app.post('/api/financial-insight', async (req, res) => {
  try {
    const { category = 'Food & Grocery', amount = 650, month = 'August 2022', householdSize = 2 } = req.body;
    const result = await generateFinancialInsightWithAI(category, amount, month, householdSize);
    return res.json(result);
  } catch (error: any) {
    console.error('Server error in /api/financial-insight:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// LITbot Agent Config endpoint (reads live welcomeNote & iceBreakers from configured BotPenguin AI Agent)
app.get('/api/litbot/agent-config', async (req, res) => {
  try {
    const config = await getBotPenguinAgentConfig();
    return res.json(config);
  } catch (error: any) {
    console.error('Server error in GET /api/litbot/agent-config:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// LITbot Chat endpoint (BotPenguin AI Agent basis + Canadian BIA guidance + document analysis)
app.post('/api/litbot/chat', async (req, res) => {
  try {
    const { prompt, messages = [], attachments = [], contextProfile, sessionId } = req.body;
    if (!prompt && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'prompt or attachments parameter is required' });
    }

    const result = await processLitBotChatRequest(
      prompt || 'Please analyze the attached document.',
      messages,
      attachments,
      contextProfile,
      [],
      sessionId
    );
    return res.json(result);
  } catch (error: any) {
    console.error('Server error in /api/litbot/chat:', error);
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
