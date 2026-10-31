import { config } from "@/constants/config";
import { copy } from "@/constants/copy";
import { isPredictSuccessResponse } from "@/types/screening";
import { appendAudio } from "./audio-file";
import { validChildId } from "./audio-format";
import { requestFailure, requestPrediction, throwIfAborted } from "./client";
import { mockPredict, type MockScenario } from "./screening.mock";

export interface PredictOptions {
  audioUri: string;
  childId?: string;
  signal?: AbortSignal;
  mockScenario?: MockScenario;
  onResponse?: () => void;
}

export async function predictCough({
  audioUri,
  childId,
  signal,
  mockScenario,
  onResponse,
}: PredictOptions) {
  throwIfAborted(signal);
  const body = new FormData();
  await appendAudio(body, audioUri, signal);
  throwIfAborted(signal);
  if (validChildId(childId)) body.append("child_id", childId);
  if (config.useMockApi)
    return mockPredict({
      scenario: __DEV__ ? mockScenario : "normal",
      signal,
      onResponse,
    });
  if (!config.apiUrl)
    throw requestFailure("server", copy.networkErrors.configuration);
  const payload = await requestPrediction(`${config.apiUrl}/predict`, body, {
    signal,
    onResponse,
  });
  if (!isPredictSuccessResponse(payload))
    throw requestFailure("server", copy.networkErrors.invalidResponse);
  return payload;
}
