const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { checkLocalEnv } = require('./check-local-env.cjs');

function fixture(t, files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pneumo-env-test-'));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, name), content);
  }
  t.after(() => {
    if (!path.resolve(root).startsWith(path.join(os.tmpdir(), 'pneumo-env-test-'))) {
      throw new Error('Unexpected test directory');
    }
    fs.rmSync(root, { recursive: true, force: true });
  });
  return root;
}

test('missing config reports variable names without guessing credentials', (t) => {
  assert.deepEqual(checkLocalEnv(fixture(t), 'production', {}), [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ]);
});

test('release resolves production dotenv files before the base file', (t) => {
  const root = fixture(t, {
    '.env': 'EXPO_PUBLIC_SUPABASE_URL=invalid\nEXPO_PUBLIC_SUPABASE_ANON_KEY=fixture-public-key',
    '.env.production': 'EXPO_PUBLIC_SUPABASE_URL=https://project.example.test',
  });
  assert.deepEqual(checkLocalEnv(root, 'production', {}), []);
  assert.deepEqual(checkLocalEnv(root, 'development', {}), ['EXPO_PUBLIC_SUPABASE_URL']);
});

test('terminal config takes precedence over dotenv, including explicit mock defaults', (t) => {
  const root = fixture(t, { '.env': 'EXPO_PUBLIC_SUPABASE_URL=invalid' });
  assert.deepEqual(checkLocalEnv(root, 'production', {
    EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'fixture-public-key',
    EXPO_PUBLIC_USE_MOCK_DATA: 'true',
  }), []);
});

test('rejects invalid URL schemes and blank keys without returning their values', (t) => {
  assert.deepEqual(checkLocalEnv(fixture(t), 'production', {
    EXPO_PUBLIC_SUPABASE_URL: 'file:///private-value',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: '   ',
  }), ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY']);
});
