const express = require('express');
const path = require('path');

const raiRoute = require('./routes/rai');

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'privacy-vault' });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use('/rai', raiRoute);

module.exports = app;
