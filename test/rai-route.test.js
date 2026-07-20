const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../app');
const { resolveAnthropicApiKey } = require('../routes/rai');

test('prefers an API key supplied in the request header', () => {
  const req = {
    get: (name) => (name === 'x-anthropic-api-key' ? 'header-key' : undefined)
  };

  assert.equal(resolveAnthropicApiKey(req, { ANTHROPIC_API_KEY: 'env-key' }), 'header-key');
});

test('falls back to the environment API key when no request key was supplied', () => {
  const req = {
    get: () => undefined
  };

  assert.equal(resolveAnthropicApiKey(req, { ANTHROPIC_API_KEY: 'env-key' }), 'env-key');
});

test('stream endpoint rejects requests without the access key', async () => {
  const server = app.listen(0);

  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/rai/stream_events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ input: 'hello' })
    });

    assert.equal(response.status, 401);
    const body = await response.json();
    assert.match(body.error, /invalid or missing key/i);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
