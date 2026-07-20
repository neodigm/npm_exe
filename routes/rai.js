const express = require('express');
const { ChatAnthropic } = require('@langchain/anthropic');

const router = express.Router();

const RAI_MODEL = 'claude-sonnet-4-6';
const RAI_ACCESS_KEY = '0197';

function resolveAnthropicApiKey(req, env = process.env) {
  const suppliedKey = req.get('x-anthropic-api-key') || req.get('x-rai-api-key') || req.query?.apiKey;
  return suppliedKey || env.ANTHROPIC_API_KEY || '';
}

function normalizeTextContent(content) {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item === 'string' ? item : item?.text ?? ''))
      .join('');
  }

  if (content && typeof content === 'object') {
    return content.text ?? '';
  }

  return '';
}

function readChunkText(chunk) {
  const content = chunk?.content ?? chunk ?? '';
  return normalizeTextContent(content);
}

router.get('/health', (_req, res) => {
  res.json({ ok: true, endpoint: 'rai' });
});

router.post('/stream_events', async (req, res) => {
  const key = req.query.key || req.get('x-rai-key');
  if (key !== RAI_ACCESS_KEY) {
    return res.status(401).json({ ok: false, error: 'Invalid or missing key' });
  }

  const apiKey = resolveAnthropicApiKey(req);
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: 'ANTHROPIC_API_KEY not configured on the server or supplied in the request'
    });
  }

  try {
    const input = req.body?.input ?? req.body ?? 'Hello';
    const model = new ChatAnthropic({
      apiKey,
      model: RAI_MODEL,
      streaming: true,
      temperature: 0.7
    });

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const serverStream = await model.streamEvents(input, { version: 'v2' });
    for await (const event of serverStream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('[rai] streamEvents error:', error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Failed to fetch stream' });
    } else {
      res.end();
    }
  }
});

router.post('/stream_events/threads/:threadId/runs/stream', async (req, res) => {
  const key = req.query.key || req.get('x-rai-key');
  if (key !== RAI_ACCESS_KEY) {
    return res.status(401).json({ ok: false, error: 'Invalid or missing key' });
  }

  const apiKey = resolveAnthropicApiKey(req);
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: 'ANTHROPIC_API_KEY not configured on the server or supplied in the request'
    });
  }

  try {
    const { threadId } = req.params;
    const { input } = req.body ?? {};
    const messages = Array.isArray(input?.messages) ? input.messages : [];
    const lastMsg = messages[messages.length - 1] ?? messages[0];
    let userPrompt = normalizeTextContent(lastMsg?.content ?? 'Hello!');

    const model = new ChatAnthropic({
      apiKey,
      model: RAI_MODEL,
      streaming: true,
      temperature: 0.7
    });

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    console.log(`[rai] run stream request for thread: ${threadId}`);
    const stream = await model.stream(userPrompt);
    for await (const chunk of stream) {
      const text = readChunkText(chunk);
      if (text) {
        res.write(text);
      }
    }

    res.end();
  } catch (error) {
    console.error('[rai] runs/stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Failed to fetch stream' });
    } else {
      res.end();
    }
  }
});

module.exports = router;
module.exports.resolveAnthropicApiKey = resolveAnthropicApiKey;
