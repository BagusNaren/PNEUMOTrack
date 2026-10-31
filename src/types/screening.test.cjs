const assert = require('node:assert/strict');
const test = require('node:test');

const { isPredictSuccessResponse, isPredictErrorResponse } = require('./screening.ts');

function success(overrides = {}) {
  return {
    status: 'success',
    result: 'risk',
    raw_label: 'Pneumonia',
    agreement: true,
    votes: { autoencoder: 'risk', ocsvm: 'risk' },
    autoencoder: { error: 0.0012, threshold: 0.0031 },
    ocsvm: { score: 12.3 },
    chunks: 4,
    duration_sec: 6.2,
    waveform: [0, 0.2, 0.8, 1],
    summary: 'Contoh respons untuk pengujian kontrak.',
    model_version: 'v3',
    ...overrides,
  };
}

test('accepts risk, normal, and model disagreement without assuming a tie-break rule', () => {
  const normal = success({
    result: 'normal',
    raw_label: 'Bukan Pneumonia',
    votes: { autoencoder: 'normal', ocsvm: 'normal' },
    ocsvm: { score: -1.5 },
  });

  for (const response of [success(), normal]) {
    assert.equal(isPredictSuccessResponse(response), true);
    for (const votes of [
      { autoencoder: 'normal', ocsvm: 'risk' },
      { autoencoder: 'risk', ocsvm: 'normal' },
    ]) {
      assert.equal(isPredictSuccessResponse({ ...response, agreement: false, votes }), true);
    }
  }
});

test('rejects every missing success field', () => {
  for (const field of Object.keys(success())) {
    const response = success();
    delete response[field];
    assert.equal(isPredictSuccessResponse(response), false, field);
  }
});

test('rejects absent or malformed nested model fields', () => {
  for (const overrides of [
    { votes: null },
    { votes: [] },
    { votes: { autoencoder: 'risk' } },
    { votes: { ocsvm: 'risk' } },
    { votes: { autoencoder: 'inlier', ocsvm: 'risk' } },
    { votes: { autoencoder: 'risk', ocsvm: 'outlier' } },
    { autoencoder: null },
    { autoencoder: [] },
    { autoencoder: { error: 0.1 } },
    { autoencoder: { threshold: 0.1 } },
    { ocsvm: null },
    { ocsvm: [] },
    { ocsvm: {} },
  ]) {
    assert.equal(isPredictSuccessResponse(success(overrides)), false);
  }
});

test('rejects non-finite, negative, and incorrectly typed model metrics', () => {
  for (const value of [NaN, Infinity, -Infinity, null, undefined, '0.1', true]) {
    for (const overrides of [
      { autoencoder: { error: value, threshold: 0.1 } },
      { autoencoder: { error: 0.1, threshold: value } },
      { ocsvm: { score: value } },
      { chunks: value },
      { duration_sec: value },
    ]) {
      assert.equal(isPredictSuccessResponse(success(overrides)), false);
    }
  }
  for (const overrides of [
    { autoencoder: { error: -0.1, threshold: 0.1 } },
    { autoencoder: { error: 0.1, threshold: -0.1 } },
    { chunks: -1 },
    { chunks: 1.5 },
    { chunks: Number.MAX_SAFE_INTEGER + 1 },
    { duration_sec: -1 },
  ]) {
    assert.equal(isPredictSuccessResponse(success(overrides)), false);
  }
});

test('rejects malformed and out-of-range waveform points, including sparse arrays', () => {
  for (const waveform of [
    null, {}, '0.5', [NaN], [Infinity], [-0.1], [1.01], ['0.5'], [null], Array(2),
  ]) {
    assert.equal(isPredictSuccessResponse(success({ waveform })), false);
  }
});

test('rejects invalid discriminants, empty summaries, and contradictory predictions', () => {
  for (const overrides of [
    { status: 'error' },
    { result: 'anomaly' },
    { raw_label: 'inlier' },
    { agreement: 'true' },
    { summary: '' },
    { summary: '   ' },
    { summary: 1 },
    { model_version: '' },
    { model_version: '   ' },
    { model_version: 3 },
    { raw_label: 'Bukan Pneumonia' },
    { agreement: false },
    { votes: { autoencoder: 'risk', ocsvm: 'normal' } },
    { votes: { autoencoder: 'normal', ocsvm: 'normal' } },
  ]) {
    assert.equal(isPredictSuccessResponse(success(overrides)), false);
  }
});

test('accepts every documented error code with an optional message', () => {
  for (const code of [
    'AUDIO_TOO_SHORT', 'AUDIO_SILENT', 'NO_COUGH_DETECTED', 'AUDIO_TOO_NOISY',
    'UNSUPPORTED_FORMAT', 'FILE_TOO_LARGE', 'INVALID_REQUEST', 'INTERNAL_ERROR',
  ]) {
    assert.equal(isPredictErrorResponse({ status: 'error', code }), true);
    assert.equal(isPredictErrorResponse({ status: 'error', code, message: 'Contoh pesan.' }), true);
    assert.equal(isPredictSuccessResponse({ status: 'error', code }), false);
  }
});

test('rejects unknown codes and malformed error envelopes', () => {
  for (const response of [
    { status: 'error', code: 'UNKNOWN' },
    { status: 'error' },
    { status: 'success', code: 'INTERNAL_ERROR' },
    { code: 'INTERNAL_ERROR' },
    { status: 'error', code: 'INTERNAL_ERROR', message: null },
    { status: 'error', code: 'INTERNAL_ERROR', message: 500 },
    success(),
  ]) {
    assert.equal(isPredictErrorResponse(response), false);
  }
});

test('rejects non-object envelopes and legacy backend responses without throwing', () => {
  for (const response of [
    null, undefined, true, 42, 'success', [], [success()],
    { prediction: 'Pneumonia', confidence: 1 },
    { label: 'anomaly', agreement: true },
  ]) {
    assert.equal(isPredictSuccessResponse(response), false);
    assert.equal(isPredictErrorResponse(response), false);
  }
});
