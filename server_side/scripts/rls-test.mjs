#!/usr/bin/env node
/**
 * Local RLS acceptance test (Sprint 3, Member A).
 * Requires the Docker Compose stack: bun run db:up && bun run db:migrate
 *
 * Usage: node server_side/scripts/rls-test.mjs
 * Exits non-zero on the first failed expectation.
 */

const URL_BASE = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const runId = Date.now();

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

async function request(path, { token, method = 'GET', body, prefer } = {}) {
  const headers = { apikey: ANON_KEY, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(`${URL_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: response.status, body: json };
}

async function signup(label) {
  const email = `rls-${label}-${runId}@local.dev`;
  const response = await request('/auth/v1/signup', {
    method: 'POST',
    body: { email, password: 'password123' },
  });
  if (response.status !== 200 || !response.body?.access_token) {
    fail(`signup ${label} (${response.status}) ${JSON.stringify(response.body)}`);
  }
  return { email, token: response.body.access_token, id: response.body.user.id };
}

const parentA = await signup('a');
const parentB = await signup('b');
console.log(`accounts: A=${parentA.id} B=${parentB.id}`);

const child = await request('/rest/v1/children', {
  token: parentA.token,
  method: 'POST',
  prefer: 'return=representation',
  body: { parent_id: parentA.id, name: 'Anak A', birth_date: '2022-05-01', sex: 'female' },
});
if (child.status !== 201) fail(`A insert child (${child.status}) ${JSON.stringify(child.body)}`);
const childId = child.body[0].id;
console.log(`child A created: ${childId}`);

const screening = await request('/rest/v1/screenings', {
  token: parentA.token,
  method: 'POST',
  prefer: 'return=representation',
  body: {
    child_id: childId,
    result: 'normal',
    agreement: true,
    ae_error: 0.5,
    ae_threshold: 0.03890753,
    ocsvm_score: 0.2,
    chunks: 3,
    duration_sec: 6.1,
    waveform: [0.1, 0.4, 1.0],
    summary: 'seed test',
    model_version: 'v3',
  },
});
if (screening.status !== 201) fail(`A insert screening (${screening.status}) ${JSON.stringify(screening.body)}`);
console.log('screening A created');

const bChildren = await request('/rest/v1/children?select=id', { token: parentB.token });
if (bChildren.status !== 200 || bChildren.body.length !== 0) {
  fail(`B read children expected 0, got ${bChildren.status} ${JSON.stringify(bChildren.body)}`);
}
console.log('PASS: B cannot read A children');

const bScreenings = await request('/rest/v1/screenings?select=id', { token: parentB.token });
if (bScreenings.status !== 200 || bScreenings.body.length !== 0) {
  fail(`B read screenings expected 0, got ${bScreenings.status} ${JSON.stringify(bScreenings.body)}`);
}
console.log('PASS: B cannot read A screenings');

const bInsert = await request('/rest/v1/screenings', {
  token: parentB.token,
  method: 'POST',
  body: {
    child_id: childId,
    result: 'risk',
    agreement: false,
    model_version: 'v3',
  },
});
if (bInsert.status !== 403) {
  fail(`B insert screening for A child expected 403, got ${bInsert.status} ${JSON.stringify(bInsert.body)}`);
}
console.log('PASS: B cannot insert screening for A child');

const aChildren = await request('/rest/v1/children?select=id', { token: parentA.token });
if (aChildren.status !== 200 || aChildren.body.length !== 1) {
  fail(`A read children expected 1, got ${aChildren.status} ${JSON.stringify(aChildren.body)}`);
}
const aScreenings = await request('/rest/v1/screenings?select=id,result', { token: parentA.token });
if (aScreenings.status !== 200 || aScreenings.body.length !== 1) {
  fail(`A read screenings expected 1, got ${aScreenings.status} ${JSON.stringify(aScreenings.body)}`);
}
console.log('PASS: A reads own data');

const doctors = await request('/rest/v1/doctors?select=id,name');
if (doctors.status !== 200 || doctors.body.length < 6) {
  fail(`anon doctors expected >=6, got ${doctors.status} ${JSON.stringify(doctors.body)}`);
}
const hospitals = await request('/rest/v1/hospitals?select=id,name');
if (hospitals.status !== 200 || hospitals.body.length < 10) {
  fail(`anon hospitals expected >=10, got ${hospitals.status} ${JSON.stringify(hospitals.body)}`);
}
const articles = await request('/rest/v1/articles?select=id,title');
if (articles.status !== 200 || articles.body.length < 6) {
  fail(`anon articles expected >=6, got ${articles.status} ${JSON.stringify(articles.body)}`);
}
console.log(`PASS: public read (${doctors.body.length} doctors, ${hospitals.body.length} hospitals, ${articles.body.length} articles)`);

const cleanup = await request(`/rest/v1/children?id=eq.${childId}`, {
  token: parentA.token,
  method: 'DELETE',
});
if (cleanup.status !== 204) fail(`cleanup child (${cleanup.status})`);

console.log('ALL RLS CHECKS PASSED');
