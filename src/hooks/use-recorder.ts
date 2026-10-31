import {
  AudioModule,
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type AudioRecorder,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import {
  MAX_RECORD_DURATION_SEC,
  MIN_RECORD_DURATION_SEC,
} from "@/constants/config";
import { copy } from "@/constants/copy";
import { cleanupAudioFile, retryAudioCleanup } from "@/services/api/audio-file";
import { ScreeningFailure } from "@/services/api/client";

const audioModule = AudioModule;
const JS_STATE_THROTTLE_MS = 200;

type RecorderSnapshot = {
  phase: "idle" | "recording" | "paused" | "stopped";
  durationMs: number;
  meteringHistory: number[];
  audioUri: string | null;
  permission: "unknown" | "granted" | "denied" | "blocked";
  noiseLevel: number | null;
  noiseStatus: "safe" | "noisy" | "unknown";
  isCheckingNoise: boolean;
  interrupted: boolean;
  busy: boolean;
  error: string | null;
};
const initial: RecorderSnapshot = {
  phase: "idle",
  durationMs: 0,
  meteringHistory: [],
  audioUri: null,
  permission: "unknown",
  noiseLevel: null,
  noiseStatus: "unknown",
  isCheckingNoise: false,
  interrupted: false,
  busy: false,
  error: null,
};
const options = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  isMeteringEnabled: true,
};

export function useRecorder() {
  const [state, setState] = useState(initial);
  const current = useRef(initial);
  const alive = useRef(true);
  const recorder = useRef<AudioRecorder | null>(null);
  const mode = useRef<"noise" | "record" | null>(null);
  const stopping = useRef(false);
  const transferred = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pendingTasks = useRef(0);
  const pollStopQueued = useRef(false);
  const noiseSamples = useRef<number[]>([]);
  const meteringBuffer = useRef<number[]>([]);
  const lastTimerPublishMs = useRef(0);
  const lastNoisePublishMs = useRef(0);
  const liveMetering = useSharedValue<readonly number[]>([]);

  const publish = useCallback((patch: Partial<RecorderSnapshot>) => {
    current.current = { ...current.current, ...patch };
    if (alive.current) setState(current.current);
  }, []);

  const perform = useCallback(
    (work: () => Promise<void>) => {
      pendingTasks.current += 1;
      if (alive.current && !current.current.busy) {
        publish({ busy: true, error: null });
      }
      const task = queue.current.then(async () => {
        if (!alive.current) {
          pendingTasks.current = Math.max(0, pendingTasks.current - 1);
          return false;
        }
        publish({ busy: true, error: null });
        try {
          await work();
          return true;
        } catch (error) {
          publish({
            error:
              error instanceof ScreeningFailure
                ? error.detail.userMessage
                : copy.record.failed,
          });
          return false;
        } finally {
          pendingTasks.current = Math.max(0, pendingTasks.current - 1);
          if (pendingTasks.current === 0) {
            publish({ busy: false });
          }
        }
      });
      queue.current = task;
      return task;
    },
    [publish],
  );

  const performUserAction = useCallback(
    (work: () => Promise<void>) => {
      if (current.current.busy || pendingTasks.current > 0) {
        return Promise.resolve(false);
      }
      return perform(work);
    },
    [perform],
  );

  const finish = useCallback(
    async (completedUri?: string | null) => {
      const audio = recorder.current;
      if (!audio || !mode.current) return;
      const recordingMode = mode.current;
      stopping.current = true;
      let stopFailure: unknown;
      let uri = completedUri ?? audio.uri;
      if (uri) publish({ audioUri: uri });
      try {
        const status = audio.getStatus();
        const measuredDuration = Math.max(
          current.current.durationMs,
          status.durationMillis,
        );
        const durationMs = Math.min(
          MAX_RECORD_DURATION_SEC * 1000,
          completedUri &&
            recordingMode === "record" &&
            measuredDuration >= 29_800
            ? 30_000
            : measuredDuration,
        );
        if (!completedUri) {
          try {
            await audio.stop();
          } catch (failure) {
            stopFailure = failure;
          }
        }
        uri = completedUri ?? audio.uri ?? uri;
        // Keep ownership until deletion succeeds, including recordings used only for noise checks.
        publish({
          audioUri: uri,
          durationMs,
          meteringHistory:
            recordingMode === "record" ? [...meteringBuffer.current] : [],
          phase:
            recordingMode === "record" && !stopFailure ? "stopped" : "idle",
          isCheckingNoise: false,
        });
        if (recordingMode === "noise" && uri) {
          await cleanupAudioFile(uri);
          const measured = noiseSamples.current;
          const average = measured.length
            ? measured.reduce((sum, n) => sum + n, 0) / measured.length
            : null;
          publish({
            audioUri: null,
            durationMs: 0,
            noiseLevel: average,
            noiseStatus:
              average === null ? "unknown" : average >= 0.55 ? "noisy" : "safe",
          });
        }
      } finally {
        mode.current = null;
        recorder.current = null;
        stopping.current = false;
        pollStopQueued.current = false;
        try {
          audio.release();
        } finally {
          await setAudioModeAsync({ allowsRecording: false });
        }
      }
      if (stopFailure) throw stopFailure;
    },
    [publish],
  );

  const removeOwnedFile = useCallback(async () => {
    if (current.current.audioUri && !transferred.current)
      await cleanupAudioFile(current.current.audioUri);
    transferred.current = false;
    publish({ audioUri: null });
  }, [publish]);

  const checkPermission = useCallback(
    async (request: boolean) => {
      // SDK 58's web permission getter can request access while status is still "prompt".
      if (Platform.OS === "web" && !request) {
        try {
          const permission = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          publish({
            permission:
              permission.state === "granted"
                ? "granted"
                : permission.state === "denied"
                  ? "blocked"
                  : "unknown",
          });
        } catch {
          /* Browsers without Permissions API wait for the explicit permission button. */
        }
        return current.current.permission === "granted";
      }
      let permission =
        Platform.OS === "web"
          ? await requestRecordingPermissionsAsync()
          : await getRecordingPermissionsAsync();
      if (
        Platform.OS !== "web" &&
        request &&
        !permission.granted &&
        permission.canAskAgain
      )
        permission = await requestRecordingPermissionsAsync();
      publish({
        permission: permission.granted
          ? "granted"
          : permission.canAskAgain
            ? "denied"
            : "blocked",
      });
      return permission.granted;
    },
    [publish],
  );

  const begin = useCallback(
    (kind: "noise" | "record") =>
      perform(async () => {
        if (mode.current) return;
        if (!(await checkPermission(false))) return;
        await removeOwnedFile();
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          allowsBackgroundRecording: false,
          shouldPlayInBackground: false,
        });
        const platformOptions =
          Platform.OS === "ios"
            ? options.ios
            : Platform.OS === "android"
              ? options.android
              : options.web;
        const audio = new audioModule.AudioRecorder({
          ...options,
          ...platformOptions,
        });
        recorder.current = audio;
        mode.current = kind;
        audio.addListener("recordingStatusUpdate", (event) => {
          if (event.hasError) {
            if (!stopping.current)
              void perform(async () => {
                await finish(event.url);
                await removeOwnedFile();
                publish({
                  error: copy.record.failed,
                  interrupted: true,
                  phase: "idle",
                });
              });
          } else if (event.isFinished && !stopping.current) {
            void perform(() => finish(event.url));
          }
        });
        try {
          await audio.prepareToRecordAsync(options);
          if (
            !alive.current ||
            (AppState.currentState && AppState.currentState !== "active")
          ) {
            await finish();
            return;
          }
          noiseSamples.current = [];
          meteringBuffer.current = [];
          lastTimerPublishMs.current = 0;
          lastNoisePublishMs.current = 0;
          liveMetering.set([]);
          publish({
            phase: kind === "record" ? "recording" : "idle",
            durationMs: 0,
            meteringHistory: [],
            noiseLevel: null,
            noiseStatus: "unknown",
            isCheckingNoise: kind === "noise",
            interrupted: false,
          });
          audio.record({
            forDuration: kind === "noise" ? 3 : MAX_RECORD_DURATION_SEC,
          });
        } catch (error) {
          await finish();
          throw error;
        }
      }),
    [
      checkPermission,
      finish,
      liveMetering,
      perform,
      publish,
      removeOwnedFile,
    ],
  );

  useEffect(() => {
    alive.current = true;
    void perform(async () => {
      await retryAudioCleanup();
      await checkPermission(false);
    });
    const interval = setInterval(() => {
      const audio = recorder.current;
      if (!audio || !mode.current || stopping.current) return;
      try {
        const status = audio.getStatus();
        if (!status.isRecording) return;
        const durationMs = Math.min(
          MAX_RECORD_DURATION_SEC * 1000,
          status.durationMillis,
        );
        const db = status.metering;
        // Relative dBFS heuristic, not calibrated sound pressure or medical audio validation.
        const level =
          db === undefined || !Number.isFinite(db)
            ? null
            : Math.max(0, Math.min(1, (db + 60) / 60));
        if (mode.current === "noise") {
          if (level !== null) noiseSamples.current.push(level);
          const nextStatus =
            level === null ? "unknown" : level >= 0.55 ? "noisy" : "safe";
          if (
            nextStatus !== current.current.noiseStatus ||
            durationMs - lastNoisePublishMs.current >= JS_STATE_THROTTLE_MS
          ) {
            lastNoisePublishMs.current = durationMs;
            publish({
              noiseLevel: level,
              noiseStatus: nextStatus,
            });
          }
        } else {
          // Push live amplitude samples to the Reanimated UI thread without triggering a React tree re-render.
          if (level !== null) {
            const nextSamples = [...meteringBuffer.current.slice(-59), level];
            meteringBuffer.current = nextSamples;
            liveMetering.set(nextSamples);
          }
          if (
            durationMs - lastTimerPublishMs.current >= JS_STATE_THROTTLE_MS ||
            durationMs >= MAX_RECORD_DURATION_SEC * 1000
          ) {
            lastTimerPublishMs.current = durationMs;
            publish({ durationMs });
          }
        }
        if (
          durationMs >=
            (mode.current === "noise"
              ? 3000
              : MAX_RECORD_DURATION_SEC * 1000) &&
          !pollStopQueued.current
        ) {
          pollStopQueued.current = true;
          void perform(() => finish());
        }
      } catch {
        publish({ error: copy.record.failed });
      }
    }, 100);
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active" && mode.current) {
        publish({ interrupted: mode.current === "record" });
        void perform(() => finish());
      } else if (next === "active")
        void perform(async () => {
          await checkPermission(false);
        });
    });
    return () => {
      alive.current = false;
      clearInterval(interval);
      subscription.remove();
      // Wait for an in-flight prepare before stopping and disposing its recorder.
      queue.current = queue.current.then(async () => {
        try {
          await finish();
        } catch {
          /* Disposal still attempts to remove the recorder's captured URI. */
        }
        try {
          await removeOwnedFile();
        } catch {
          /* Failed file deletions stay queued for the next recorder session. */
        }
      });
    };
  }, [
    checkPermission,
    finish,
    liveMetering,
    perform,
    publish,
    removeOwnedFile,
  ]);

  const cancelRecording = useCallback(
    () =>
      perform(async () => {
        await finish();
        await removeOwnedFile();
        meteringBuffer.current = [];
        lastTimerPublishMs.current = 0;
        lastNoisePublishMs.current = 0;
        liveMetering.set([]);
        publish({ ...initial, permission: current.current.permission });
      }),
    [finish, liveMetering, perform, publish, removeOwnedFile],
  );

  const stopOnBlur = useCallback(
    () =>
      perform(async () => {
        if (!mode.current) return;
        await finish();
      }),
    [finish, perform],
  );

  return {
    ...state,
    liveMetering,
    isTooShort: state.durationMs < MIN_RECORD_DURATION_SEC * 1000,
    requestPermission: () =>
      performUserAction(async () => {
        await checkPermission(true);
      }),
    openSettings: () =>
      performUserAction(async () => {
        try {
          await Linking.openSettings();
        } catch {
          publish({ error: copy.record.settingsError });
        }
      }),
    startNoiseCheck: () => {
      if (current.current.busy || pendingTasks.current > 0) {
        return Promise.resolve(false);
      }
      return begin("noise");
    },
    stopNoiseCheck: () => perform(() => finish()),
    startRecording: () => {
      if (current.current.busy || pendingTasks.current > 0) {
        return Promise.resolve(false);
      }
      return begin("record");
    },
    pauseRecording: () =>
      performUserAction(async () => {
        if (mode.current !== "record" || current.current.phase !== "recording")
          return;
        const durationMs =
          recorder.current?.getStatus().durationMillis ??
          current.current.durationMs;
        recorder.current?.pause();
        publish({
          phase: "paused",
          durationMs,
          meteringHistory: [...meteringBuffer.current],
        });
      }),
    resumeRecording: () =>
      performUserAction(async () => {
        if (mode.current !== "record" || current.current.phase !== "paused")
          return;
        recorder.current?.record();
        publish({ phase: "recording" });
      }),
    stopRecording: () => performUserAction(() => finish()),
    stopOnBlur,
    cancelRecording,
    resetRecorder: cancelRecording,
    transferAudioOwnership: () => {
      transferred.current = true;
    },
    cleanupAudioFile,
  };
}
