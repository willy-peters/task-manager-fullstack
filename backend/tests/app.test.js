// Phase 1 gate: HTTP contract tests that run without a database.
// Every request here is rejected (or answered) before Mongoose is touched.
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import request from 'supertest';

// env.js exits the process when these are missing, so set them before importing the app
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/task-manager-test';
process.env.JWT_SECRET ??= 'test-secret-for-automated-tests-only';

let app;
before(async () => {
  ({ default: app } = await import('../src/app.js'));
});

describe('Health', () => {
  test('GET /api/v1/health returns 200 with status payload', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, 'API is running');
    assert.equal(typeof res.body.uptime, 'number');
    assert.ok(!Number.isNaN(Date.parse(res.body.timestamp)));
  });
});

describe('OpenAPI documentation', () => {
  test('GET /api-docs.json exposes every documented endpoint', async () => {
    const res = await request(app).get('/api-docs.json');
    assert.equal(res.status, 200);
    assert.equal(res.body.openapi, '3.0.3');
    assert.equal(res.body.servers[0].url, '/api/v1');

    const paths = Object.keys(res.body.paths);
    for (const p of ['/health', '/auth/register', '/auth/login', '/auth/me', '/tasks', '/tasks/{id}']) {
      assert.ok(paths.includes(p), `missing path ${p}`);
    }
    assert.deepEqual(
      Object.keys(res.body.paths['/tasks/{id}']).sort(),
      ['delete', 'get', 'put']
    );
    assert.deepEqual(res.body.components.schemas.Task.properties.status.enum, [
      'pending',
      'in-progress',
      'completed',
    ]);
    assert.equal(res.body.components.securitySchemes.bearerAuth.scheme, 'bearer');
  });

  test('GET /api-docs/ serves Swagger UI', async () => {
    const res = await request(app).get('/api-docs/');
    assert.equal(res.status, 200);
    assert.match(res.text, /swagger-ui/i);
  });
});

describe('Authorization', () => {
  test('GET /api/v1/tasks without a token returns 401', async () => {
    const res = await request(app).get('/api/v1/tasks');
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { success: false, message: 'Not authorized: no token provided' });
  });

  test('GET /api/v1/auth/me with a malformed token returns 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-real-jwt');
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Invalid token');
  });
});

describe('Validation', () => {
  test('POST /api/v1/auth/register with invalid fields returns 400 with field errors', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: 'short' });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Validation failed');
    const fields = res.body.errors.map((e) => e.field).sort();
    assert.deepEqual(fields, ['email', 'name', 'password']);
  });

  test('POST /api/v1/auth/login with missing fields returns 400', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.length >= 2);
  });

  test('malformed JSON body returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'Malformed JSON in request body');
  });
});

describe('Error handling', () => {
  test('unknown routes return a 404 JSON error', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Route not found/);
  });

  test('responses carry security headers from helmet', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
  });
});

describe('Server bootstrap', () => {
  test('server.js listens exactly once and handles SIGTERM / SIGINT', async () => {
    const source = await readFile(new URL('../src/server.js', import.meta.url), 'utf8');
    assert.equal(source.match(/app\.listen\(/g)?.length, 1, 'app.listen must be called exactly once');
    assert.ok(source.indexOf('await connectDB()') < source.indexOf('app.listen('), 'DB must connect before listening');
    assert.match(source, /process\.on\('SIGTERM'/);
    assert.match(source, /process\.on\('SIGINT'/);
  });
});
