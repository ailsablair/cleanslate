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
import {
  getPlaidStatus,
  createPlaidLinkToken,
  exchangePlaidPublicToken,
  syncPlaidItemsForUser,
  removePlaidItem,
} from './src/server/plaidService';
import { parseBankStatementPdfWithAI } from './src/server/statementParser';

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

// Bank Sync: Plaid Status
app.get('/api/bank/plaid/status', (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
  res.json(getPlaidStatus(userId));
});

// Bank Sync: Create Plaid Link Token (supports Canadian institutions & OAuth redirects)
app.post('/api/bank/plaid/create-link-token', async (req, res) => {
  try {
    const { userId = 'demo-user-chad-001', redirectUri } = req.body || {};
    const result = await createPlaidLinkToken(userId, redirectUri);
    if (!result.configured) {
      return res.status(503).json(result);
    }
    return res.json(result);
  } catch (error: any) {
    console.error('Server error in /api/bank/plaid/create-link-token:', error);
    return res.status(500).json({
      configured: true,
      error: error?.response?.data?.error_message || error.message || 'Failed to create Plaid Link token',
    });
  }
});

// Bank Sync: Exchange Plaid Public Token for server-stored access_token & initial sync
app.post('/api/bank/plaid/exchange-token', async (req, res) => {
  try {
    const { publicToken, userId = 'demo-user-chad-001', institutionName } = req.body || {};
    if (!publicToken) {
      return res.status(400).json({ error: 'publicToken is required' });
    }
    const result = await exchangePlaidPublicToken(publicToken, userId, institutionName);
    return res.json(result);
  } catch (error: any) {
    console.error('Server error in /api/bank/plaid/exchange-token:', error);
    return res.status(500).json({
      error: error?.response?.data?.error_message || error.message || 'Failed to exchange Plaid token',
    });
  }
});

// Bank Sync: Sync all Plaid-linked accounts & incremental transactions
app.post('/api/bank/plaid/sync', async (req, res) => {
  try {
    const { userId } = req.body || {};
    const result = await syncPlaidItemsForUser(userId);
    return res.json(result);
  } catch (error: any) {
    console.error('Server error in /api/bank/plaid/sync:', error);
    return res.status(500).json({
      error: error?.response?.data?.error_message || error.message || 'Failed to sync Plaid accounts',
    });
  }
});

// Bank Sync: Disconnect a Plaid item cleanly
app.delete('/api/bank/plaid/item/:itemId', async (req, res) => {
  try {
    const removed = await removePlaidItem(req.params.itemId);
    return res.json({ removed });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to remove Plaid item' });
  }
});

// Fallback Bank Statement PDF Parser (for User-Initiated Statement Export)
app.post('/api/bank/parse-statement', async (req, res) => {
  try {
    const { fileBase64, mimeType = 'application/pdf', userId = 'demo-user-chad-001' } = req.body || {};
    if (!fileBase64) {
      return res.status(400).json({ error: 'fileBase64 is required' });
    }
    const result = await parseBankStatementPdfWithAI(fileBase64, mimeType, userId);
    return res.json(result);
  } catch (error: any) {
    console.error('Server error in /api/bank/parse-statement:', error);
    return res.status(500).json({
      success: false,
      code: 'PARSE_ERROR',
      transactions: [],
      error: error.message || 'Failed to parse statement',
    });
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
