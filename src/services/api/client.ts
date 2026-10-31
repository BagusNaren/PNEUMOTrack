import { API_TIMEOUT_MS } from "@/constants/config";
import { copy } from "@/constants/copy";
import {
  isPredictErrorResponse,
  type AudioErrorCode,
  type ScreeningError,
} from "@/types/screening";

export class ScreeningFailure extends Error {
  constructor(readonly detail: ScreeningError) {
    super(detail.userMessage);
    this.name = "ScreeningFailure";
  }
}

export function audioFailure(code: AudioErrorCode) {
  return new ScreeningFailure({
    kind: "audio_validation",
    code,
    userMessage: copy.audioErrors[code],
    canRetrySameFile: false,
  });
}

export function requestFailure(
  kind: "offline" | "timeout" | "server",
  message: string = copy.networkErrors[kind],
) {
  return new ScreeningFailure({
    kind,
    userMessage: message,
    canRetrySameFile: true,
  });
}

export function toScreeningError(error: unknown): ScreeningError {
  return error instanceof ScreeningFailure
    ? error.detail
    : requestFailure("server").detail;
}

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
}

export async function requestPrediction(
  url: string,
  body: FormData,
  {
    signal,
    onResponse,
    timeoutMs = API_TIMEOUT_MS,
  }: {
    signal?: AbortSignal;
    onResponse?: () => void;
    timeoutMs?: number;
  } = {},
): Promise<unknown> {
  throwIfAborted(signal);
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        body,
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw requestFailure("offline");
    }
    onResponse?.();
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw requestFailure("server", copy.networkErrors.invalidResponse);
    }
    if (
      response.status === 422 &&
      isPredictErrorResponse(payload) &&
      payload.code !== "INTERNAL_ERROR"
    ) {
      throw audioFailure(payload.code);
    }
    if (!response.ok) throw requestFailure("server");
    return payload;
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    if (timedOut) throw requestFailure("timeout");
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
