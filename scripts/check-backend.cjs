const path = require('node:path');
const { loadProjectEnv } = require('@expo/env');
const { checkLocalEnv } = require('./check-local-env.cjs');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  loadProjectEnv(projectRoot, { mode: 'production', silent: true });
  const missing = checkLocalEnv(projectRoot, 'production');
  if (missing.length) throw new Error(`Konfigurasi belum valid: ${missing.join(', ')}`);
  const api = new URL(process.env.EXPO_PUBLIC_API_URL);
  if (!['http:', 'https:'].includes(api.protocol)) throw new Error('EXPO_PUBLIC_API_URL harus memakai HTTP(S).');

  const checks = [
    {
      name: 'FastAPI',
      url: `${api.toString().replace(/\/$/, '')}/health`,
      valid: (body) => body.status === 'ok',
    },
    {
      name: 'Supabase Auth',
      url: `${process.env.EXPO_PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/auth/v1/health`,
      headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY },
      valid: () => true,
    },
  ];
  const results = await Promise.allSettled(checks.map(async ({ name, url, headers, valid }) => {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
    const body = await response.json();
    if (!valid(body)) throw new Error(`${name}: respons health tidak valid`);
    console.log(`${name}: OK (HTTP ${response.status})`);
  }));
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(`Backend belum siap: ${result.reason.message}`);
      process.exitCode = 1;
    }
  }
  if (process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false' || process.env.EXPO_PUBLIC_USE_MOCK_DATA !== 'false') {
    throw new Error('Untuk backend asli, isi EXPO_PUBLIC_USE_MOCK_API=false dan EXPO_PUBLIC_USE_MOCK_DATA=false.');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
