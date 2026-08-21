import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { redisConnection } from '../src/queue.js';

test.after(async () => {
  await prisma.$disconnect();
  redisConnection.removeAllListeners('error');
  redisConnection.disconnect();
});

test('GET /health reports a healthy backend', async () => {
  const response = await request(app).get('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { ok: true, service: 'reachinbox-backend' });
});

test('GET /api/me rejects unauthenticated requests', async () => {
  const response = await request(app).get('/api/me');
  assert.equal(response.status, 401);
  assert.equal(response.body.error, 'Not authenticated');
});

test('POST /api/senders validates input', async () => {
  const response = await request(app)
    .post('/api/senders')
    .send({ name: '', smtp_user: 'not-an-email', smtp_pass: '' });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Validation failed');
});
