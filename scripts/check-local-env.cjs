const path = require('node:path');
const { loadProjectEnv } = require('@expo/env');

function checkLocalEnv(projectRoot, mode, systemEnv = { ...process.env }) {
  loadProjectEnv(projectRoot, { mode, systemEnv, silent: true, force: true });
  const problems = [];
  try {
    const url = new URL(systemEnv.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '');
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch {
    problems.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  if (!systemEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    problems.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
  return problems;
}

if (require.main === module) {
  const mode = process.argv[2] === 'release' ? 'production' : 'development';
  const problems = checkLocalEnv(path.resolve(__dirname, '..'), mode);
  if (problems.length) {
    console.error(`Konfigurasi Supabase belum lengkap atau tidak valid: ${problems.join(', ')}.`);
    console.error('Isi variabel tersebut di .env pada root proyek atau environment terminal.');
    console.error('Untuk testing UI tanpa backend, jalankan bun run android:release -Mock atau bun run android:local -Mock (data simulasi).');
    process.exitCode = 1;
  } else {
    console.log('Konfigurasi Supabase: OK.');
  }
}

module.exports = { checkLocalEnv };
