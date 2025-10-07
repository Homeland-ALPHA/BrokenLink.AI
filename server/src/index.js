/* File: server/src/index.js - Express server entry point for BrokenLink AI backend */
import express from 'express';
import cors from 'cors';
import { scanWebsite } from './scanner.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

const normaliseCooperation = (input) => {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const safe = {};
  if (input.whitelistIP === true) {
    safe.whitelistIP = true;
  }
  if (input.siteCredentials && typeof input.siteCredentials === 'object') {
    const { user, pass } = input.siteCredentials;
    if (typeof user === 'string' && typeof pass === 'string') {
      safe.siteCredentials = { user, pass };
    }
  }
  if (typeof input.apiKey === 'string' && input.apiKey.trim()) {
    safe.apiKey = input.apiKey.trim();
  }

  return Object.keys(safe).length > 0 ? safe : undefined;
};

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/scan', async (req, res) => {
  const { url, cooperation, allowBrowserFallback } = req.body ?? {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Request body must include a valid url string.' });
  }

  try {
    const results = await scanWebsite(url, {
      cooperation: normaliseCooperation(cooperation),
      allowBrowserFallback,
    });
    return res.json(results);
  } catch (error) {
    const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
    const responseBody = { error: error.message ?? 'Failed to scan url.' };
    if (error.reason) {
      responseBody.reason = error.reason;
    }
    if (Array.isArray(error.partialFindings)) {
      responseBody.partialFindings = error.partialFindings;
    }
    if (statusCode >= 500) {
      console.error('Scan failed unexpectedly', { url, reason: error.reason, message: error.message });
    }
    return res.status(statusCode).json(responseBody);
  }
});

app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
