// src/types/screening.ts
// API contract types matching §4.1 of the sprint plan

export type ScreeningResult = 'risk' | 'normal';

export type AudioErrorCode =
  | 'AUDIO_TOO_SHORT'
  | 'AUDIO_SILENT'
  | 'NO_COUGH_DETECTED'
  | 'AUDIO_TOO_NOISY'
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE';

export type NetworkErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'SERVER_ERROR';

export interface ModelVotes {
  autoencoder: ScreeningResult;
  ocsvm: ScreeningResult;
}

export interface AutoencoderResult {
  error: number;
  threshold: number;
}

export interface OcsvmResult {
  score: number;
}

export interface PredictResponse {
  status: 'success';
  result: ScreeningResult;
  raw_label: 'Pneumonia' | 'Bukan Pneumonia';
  agreement: boolean;
  votes: ModelVotes;
  autoencoder: AutoencoderResult;
  ocsvm: OcsvmResult;
  chunks: number;
  duration_sec: number;
  waveform: number[];
  summary: string;
  model_version: string;
}

export interface AudioError {
  type: 'audio';
  status: 'error';
  code: AudioErrorCode;
  message: string;
}

export interface NetworkError {
  type: 'network';
  code: NetworkErrorCode;
  message: string;
}

export type ScreeningError = AudioError | NetworkError;

// Type guard
export function isPredictResponse(v: unknown): v is PredictResponse {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return r.status === 'success' && typeof r.result === 'string';
}

export function isAudioError(v: unknown): v is AudioError {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return r.status === 'error' && typeof r.code === 'string';
}
