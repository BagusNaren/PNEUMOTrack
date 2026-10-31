export type ScreeningOutcome = 'normal' | 'risk';

/** Label model mentah bukan diagnosis dan tidak ditampilkan sebagai hasil klinis. */
export type RawModelLabel = 'Pneumonia' | 'Bukan Pneumonia';

export type AudioErrorCode =
  | 'AUDIO_TOO_SHORT'
  | 'AUDIO_SILENT'
  | 'NO_COUGH_DETECTED'
  | 'AUDIO_TOO_NOISY'
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE';

/** Kontrak POST /predict v2; skor model bukan probabilitas medis. */
export interface PredictSuccessResponse {
  status: 'success';
  result: ScreeningOutcome;
  raw_label: RawModelLabel;
  agreement: boolean;
  votes: {
    autoencoder: ScreeningOutcome;
    ocsvm: ScreeningOutcome;
  };
  autoencoder: {
    error: number;
    threshold: number;
  };
  ocsvm: {
    score: number;
  };
  chunks: number;
  duration_sec: number;
  /** Amplitudo ternormalisasi 0..1, bukan sampel audio mentah. */
  waveform: number[];
  summary: string;
  model_version: string;
}

export interface PredictErrorResponse {
  status: 'error';
  code: AudioErrorCode | 'INTERNAL_ERROR';
  message?: string;
}

export type PredictResponse = PredictSuccessResponse | PredictErrorResponse;

export type ScreeningErrorKind =
  | 'audio_validation'
  | 'offline'
  | 'timeout'
  | 'server'
  | 'unknown';

export interface ScreeningError {
  kind: ScreeningErrorKind;
  code?: AudioErrorCode | 'INTERNAL_ERROR';
  /** Pesan lokal dari copy.ts, bukan pesan backend yang belum ditinjau. */
  userMessage: string;
  /** False untuk audio tidak layak; true untuk gangguan jaringan atau server. */
  canRetrySameFile: boolean;
}

/** Subset baris screenings; tidak membutuhkan raw_label atau votes yang tidak disimpan. */
export type ScreeningHistoryResult = Pick<
  PredictSuccessResponse,
  'result' | 'agreement' | 'chunks' | 'duration_sec' | 'waveform' | 'summary' | 'model_version'
> & {
  ae_error: number;
  ae_threshold: number;
  ocsvm_score: number;
};

export type ScreeningSaveStatus = 'idle' | 'saving' | 'saved' | 'save_failed';

/** Payload ke tabel screenings Supabase tanpa menyertakan file atau URI audio. */
export interface SaveScreeningPayload extends ScreeningHistoryResult {
  child_id: string;
}

export type SaveScreeningAdapter = (payload: SaveScreeningPayload) => Promise<unknown>;

export function toSaveScreeningPayload(
  childId: string,
  result: PredictSuccessResponse,
): SaveScreeningPayload {
  return {
    child_id: childId,
    result: result.result,
    agreement: result.agreement,
    ae_error: result.autoencoder.error,
    ae_threshold: result.autoencoder.threshold,
    ocsvm_score: result.ocsvm.score,
    chunks: result.chunks,
    duration_sec: result.duration_sec,
    waveform: [...result.waveform],
    summary: result.summary,
    model_version: result.model_version,
  };
}

/** Hasil aktif atau riwayat dapat dirender tanpa bergantung pada sesi rekaman. */
export interface ResultViewProps {
  result: PredictSuccessResponse | ScreeningHistoryResult;
  onRerecord?: () => void;
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

function isOutcome(value: unknown): value is ScreeningOutcome {
  return value === 'normal' || value === 'risk';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Menolak payload rusak dan label/voting yang bertentangan sebelum dirender. */
export function isPredictSuccessResponse(data: unknown): data is PredictSuccessResponse {
  if (
    !isRecord(data) ||
    data.status !== 'success' ||
    !isOutcome(data.result) ||
    (data.raw_label !== 'Pneumonia' && data.raw_label !== 'Bukan Pneumonia') ||
    typeof data.agreement !== 'boolean' ||
    !isRecord(data.votes) ||
    !isOutcome(data.votes.autoencoder) ||
    !isOutcome(data.votes.ocsvm) ||
    !isRecord(data.autoencoder) ||
    !isNonNegativeNumber(data.autoencoder.error) ||
    !isNonNegativeNumber(data.autoencoder.threshold) ||
    !isRecord(data.ocsvm) ||
    !isFiniteNumber(data.ocsvm.score) ||
    !isNonNegativeNumber(data.chunks) ||
    !Number.isSafeInteger(data.chunks) ||
    !isNonNegativeNumber(data.duration_sec) ||
    !Array.isArray(data.waveform) ||
    !Array.from(data.waveform).every(
      (point: unknown) => isFiniteNumber(point) && point >= 0 && point <= 1,
    ) ||
    !isNonEmptyString(data.summary) ||
    !isNonEmptyString(data.model_version)
  ) {
    return false;
  }

  const labelOutcome: ScreeningOutcome = data.raw_label === 'Pneumonia' ? 'risk' : 'normal';
  const votesAgree = data.votes.autoencoder === data.votes.ocsvm;

  return (
    data.result === labelOutcome &&
    data.agreement === votesAgree &&
    (!votesAgree || data.result === data.votes.autoencoder)
  );
}

function isPredictErrorCode(value: unknown): value is PredictErrorResponse['code'] {
  return (
    value === 'AUDIO_TOO_SHORT' ||
    value === 'AUDIO_SILENT' ||
    value === 'NO_COUGH_DETECTED' ||
    value === 'AUDIO_TOO_NOISY' ||
    value === 'UNSUPPORTED_FORMAT' ||
    value === 'FILE_TOO_LARGE' ||
    value === 'INTERNAL_ERROR'
  );
}

/** Kode di luar kontrak ditangani layer jaringan sebagai kesalahan protokol. */
export function isPredictErrorResponse(data: unknown): data is PredictErrorResponse {
  return (
    isRecord(data) &&
    data.status === 'error' &&
    isPredictErrorCode(data.code) &&
    (data.message === undefined || typeof data.message === 'string')
  );
}
