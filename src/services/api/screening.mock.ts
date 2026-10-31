import { copy } from "@/constants/copy";
import type { AudioErrorCode, PredictSuccessResponse } from "@/types/screening";
import { audioFailure, requestFailure, throwIfAborted } from "./client";

export const mockScenarios = [
  "normal",
  "risk",
  "disagreement",
  "AUDIO_TOO_SHORT",
  "AUDIO_SILENT",
  "NO_COUGH_DETECTED",
  "AUDIO_TOO_NOISY",
  "UNSUPPORTED_FORMAT",
  "FILE_TOO_LARGE",
  "offline",
  "timeout",
  "server",
] as const;
export type MockScenario = (typeof mockScenarios)[number];

function wait(ms: number, signal?: AbortSignal) {
  throwIfAborted(signal);
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export async function mockPredict({
  scenario = "normal",
  signal,
  onResponse,
  delayMs = 1800,
}: {
  scenario?: MockScenario;
  signal?: AbortSignal;
  onResponse?: () => void;
  delayMs?: number;
} = {}): Promise<PredictSuccessResponse> {
  await wait(delayMs / 3, signal);
  onResponse?.();
  await wait((delayMs * 2) / 3, signal);
  throwIfAborted(signal);
  if (scenario === "offline" || scenario === "timeout" || scenario === "server")
    throw requestFailure(scenario);
  if (
    scenario !== "normal" &&
    scenario !== "risk" &&
    scenario !== "disagreement"
  )
    throw audioFailure(scenario as AudioErrorCode);
  const risk = scenario !== "normal";
  return {
    status: "success",
    result: risk ? "risk" : "normal",
    raw_label: risk ? "Pneumonia" : "Bukan Pneumonia",
    agreement: scenario !== "disagreement",
    votes: {
      autoencoder: risk ? "risk" : "normal",
      ocsvm: scenario === "risk" ? "risk" : "normal",
    },
    autoencoder: { error: risk ? 0.001 : 0.009, threshold: 0.003 },
    ocsvm: { score: scenario === "risk" ? 1.2 : -0.8 },
    chunks: 3,
    duration_sec: 6.4,
    waveform: Array.from({ length: 96 }, (_, i) =>
      Math.min(
        1,
        Math.abs(Math.sin(i * 0.6)) * (i % 32 > 7 && i % 32 < 20 ? 0.9 : 0.08),
      ),
    ),
    summary:
      scenario === "normal"
        ? copy.screening.mockSummaryNormal
        : scenario === "risk"
          ? copy.screening.mockSummaryRisk
          : copy.screening.mockSummaryDisagreement,
    model_version: "simulasi-v2",
  };
}
