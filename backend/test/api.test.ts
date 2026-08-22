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

test('POST /auth/local signs in a new user and seeds a sender', async () => {
  const email = `local-${Date.now()}@example.com`;
  const agent = request.agent(app);

  try {
    const response = await agent
      .post('/auth/local')
      .send({ email, password: 'demo-password' });

    assert.equal(response.status, 200);
    assert.equal(response.body.email, email);
    assert.equal(response.body.redirect, '/dashboard');

    const me = await agent.get('/api/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.email, email);

    const senderResponse = await agent.get('/api/senders');
    assert.equal(senderResponse.status, 200);
    assert.ok(senderResponse.body.data.length >= 1);
  } finally {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.sender.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  }
});
