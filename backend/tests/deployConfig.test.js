// Phase 7 gate: verify deployment manifests, secret hygiene, and root README completeness.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('Deployment configuration', () => {
  test('frontend/vercel.json configures SPA catch-all rewrite to /index.html', async () => {
    const raw = await readFile(path.join(rootDir, 'frontend', 'vercel.json'), 'utf8');
    const config = JSON.parse(raw);
    assert.ok(Array.isArray(config.rewrites));
    assert.deepEqual(config.rewrites[0], {
      source: '/(.*)',
      destination: '/index.html',
    });
  });

  test('backend/railway.json is valid JSON with healthcheck', async () => {
    const raw = await readFile(path.join(rootDir, 'backend', 'railway.json'), 'utf8');
    const config = JSON.parse(raw);
    assert.equal(config.deploy.startCommand, 'npm start');
    assert.equal(config.deploy.healthcheckPath, '/api/v1/health');
  });

  test('backend/render.yaml exists and points to /api/v1/health', async () => {
    const raw = await readFile(path.join(rootDir, 'backend', 'render.yaml'), 'utf8');
    assert.match(raw, /rootDir:\s*backend/);
    assert.match(raw, /healthCheckPath:\s*\/api\/v1\/health/);
  });

  test('no secret backend/.env file is committed', async () => {
    await assert.rejects(access(path.join(rootDir, 'backend', '.env')));
  });

  test('.env.example files exist for both frontend and backend', async () => {
    const feEnv = await readFile(path.join(rootDir, 'frontend', '.env.example'), 'utf8');
    const beEnv = await readFile(path.join(rootDir, 'backend', '.env.example'), 'utf8');
    assert.match(feEnv, /VITE_API_BASE_URL=https:\/\/task-api-yhl4\.onrender\.com\/api\/v1/);
    assert.match(beEnv, /MONGODB_URI=/);
    assert.match(beEnv, /JWT_SECRET=/);
  });
});

describe('Root README.md', () => {
  test('contains architecture, setup, API summary, and deployment URLs/placeholders', async () => {
    const readme = await readFile(path.join(rootDir, 'README.md'), 'utf8');
    assert.match(readme, /task-manager-fullstack/);
    assert.match(readme, /https:\/\/task-api-yhl4\.onrender\.com/);
    assert.match(readme, /vercel\.app/i);
    assert.match(readme, /github\.com/i);
    assert.match(readme, /\/auth\/register/);
    assert.match(readme, /\/auth\/login/);
    assert.match(readme, /\/auth\/me/);
    assert.match(readme, /\/tasks/);
    assert.match(readme, /\/health/);
  });
});
