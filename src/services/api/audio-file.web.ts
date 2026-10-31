import { MAX_AUDIO_BYTES } from "@/constants/config";
import { audioFormat } from "./audio-format";
import { audioFailure, throwIfAborted } from "./client";

export async function appendAudio(
  body: FormData,
  uri: string,
  signal?: AbortSignal,
) {
  throwIfAborted(signal);
  const response = await fetch(uri, { signal });
  const blob = await response.blob();
  if (!blob.size) throw audioFailure("AUDIO_SILENT");
  if (blob.size > MAX_AUDIO_BYTES) throw audioFailure("FILE_TOO_LARGE");
  const format = audioFormat(uri, blob.type);
  if (!format) throw audioFailure("UNSUPPORTED_FORMAT");
  body.append("audio", blob, `cough.${format.extension}`);
}

export async function cleanupAudioFile(uri: string) {
  if (uri.startsWith("blob:")) URL.revokeObjectURL(uri);
}

export async function retryAudioCleanup() {}
