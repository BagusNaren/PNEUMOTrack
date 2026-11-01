import { File } from "expo-file-system";
import { MAX_AUDIO_BYTES } from "@/constants/config";
import { copy } from "@/constants/copy";
import { audioFormat } from "./audio-format";
import { audioFailure, ScreeningFailure } from "./client";

const pendingDeletion = new Set<string>();

export async function appendAudio(
  body: FormData,
  uri: string,
  signal?: AbortSignal,
) {
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  const file = new File(uri);
  if (!file.exists || file.size === 0) throw audioFailure("AUDIO_SILENT");
  if (file.size > MAX_AUDIO_BYTES) throw audioFailure("FILE_TOO_LARGE");
  const format = audioFormat(uri);
  if (!format) throw audioFailure("UNSUPPORTED_FORMAT");
  // SDK 58's default Expo fetch reads File bytes; URI descriptors are not supported.
  body.append("audio", file);
}

export async function cleanupAudioFile(uri: string) {
  pendingDeletion.add(uri);
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
    pendingDeletion.delete(uri);
  } catch {
    throw new ScreeningFailure({
      kind: "unknown",
      userMessage: copy.record.cleanupError,
      canRetrySameFile: true,
    });
  }
}

export async function retryAudioCleanup() {
  for (const uri of pendingDeletion) await cleanupAudioFile(uri);
}
