const express = require('express');
const path = require('path');

const raiRoute = require('./routes/rai');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Anthropic-API-Key, X-RAI-API-Key, X-RAI-KEY');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'privacy-vault' });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('/rai', raiRoute);

module.exports = app;
