import {
  toSaveScreeningPayload,
  type PredictSuccessResponse,
  type SaveScreeningAdapter,
  type SaveScreeningPayload,
  type ScreeningError,
  type ScreeningSaveStatus,
} from "@/types/screening";
import { validChildId } from "./audio-format";
import { requestFailure, toScreeningError } from "./client";
import type { MockScenario } from "./screening.mock";

export interface AnalysisInput {
  audioUri: string | null;
  childId?: string;
  scenario?: MockScenario;
  simulation: boolean;
  save?: SaveScreeningAdapter;
}

export interface ScreeningSnapshot {
  status: "idle" | "uploading" | "analyzing" | "success" | "error";
  saveStatus: ScreeningSaveStatus;
  pendingAudioUri: string | null;
  lastResult: PredictSuccessResponse | null;
  completedAt: string | null;
  error: ScreeningError | null;
  isDemo: boolean;
}

const initial: ScreeningSnapshot = {
  status: "idle",
  saveStatus: "idle",
  pendingAudioUri: null,
  lastResult: null,
  completedAt: null,
  error: null,
  isDemo: false,
};

export class ScreeningSession {
  private state = initial;
  private listeners = new Set<() => void>();
  private controller: AbortController | null = null;
  private generation = 0;
  private input: AnalysisInput | null = null;
  private pendingSavePayload: SaveScreeningPayload | null = null;
  private activeSaveAdapter: SaveScreeningAdapter | undefined = undefined;
  private savingInFlight = false;
  private clearingInFlight = false;

  constructor(
    private dependencies: {
      predict: (
        input: AnalysisInput,
        signal: AbortSignal,
        onResponse: () => void,
      ) => Promise<PredictSuccessResponse>;
      cleanup: (uri: string) => Promise<void>;
      isOnline?: () => Promise<boolean>;
      save?: SaveScreeningAdapter;
      onRiskResult?: () => void;
    },
  ) {
    this.activeSaveAdapter = dependencies.save;
  }

  setSaveAdapter = (save?: SaveScreeningAdapter) => {
    this.activeSaveAdapter = save ?? this.dependencies.save;
  };

  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(state: ScreeningSnapshot) {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }

  start = (input: AnalysisInput) => {
    if (
      this.clearingInFlight ||
      this.controller ||
      this.state.pendingAudioUri
    ) {
      return false;
    }
    this.input = input;
    void this.run(input);
    return true;
  };

  private async run(input: AnalysisInput) {
    const generation = ++this.generation;
    const controller = new AbortController();
    this.controller = controller;
    this.pendingSavePayload = null;
    this.savingInFlight = false;
    this.publish({
      ...initial,
      status: "uploading",
      pendingAudioUri: input.audioUri,
      isDemo: input.simulation,
    });
    try {
      if (
        !input.simulation &&
        this.dependencies.isOnline &&
        !(await this.dependencies.isOnline())
      ) {
        throw requestFailure("offline");
      }
      if (generation !== this.generation) return;
      const result = await this.dependencies.predict(
        input,
        controller.signal,
        () => {
          if (generation === this.generation)
            this.publish({ ...this.state, status: "analyzing" });
        },
      );
      if (generation !== this.generation) return;
      if (input.audioUri) await this.dependencies.cleanup(input.audioUri);
      if (generation !== this.generation) return;
      const saveAdapter = input.save ?? this.activeSaveAdapter;
      // Supabase RLS policy screenings_owner_insert requires child_id to reference a row
      // in public.children owned by auth.uid(). When running in preview mode or without a
      // valid UUID child_id, skip DB persistence so the screening result still renders cleanly.
      const shouldSave = Boolean(saveAdapter) && validChildId(input.childId);
      const savePayload =
        shouldSave && input.childId
          ? toSaveScreeningPayload(input.childId, result)
          : null;
      this.pendingSavePayload = savePayload;
      this.publish({
        ...this.state,
        status: "success",
        saveStatus: savePayload ? "saving" : "idle",
        pendingAudioUri: null,
        lastResult: result,
        completedAt: new Date().toISOString(),
        error: null,
      });
      if (result.result === "risk") {
        this.dependencies.onRiskResult?.();
      }
      if (savePayload && saveAdapter) {
        void this.performSave(generation, savePayload, saveAdapter);
      }
    } catch (failure) {
      if (generation !== this.generation) return;
      let error = toScreeningError(failure);
      let uri = input.audioUri;
      if (!error.canRetrySameFile && uri) {
        try {
          await this.dependencies.cleanup(uri);
          uri = null;
        } catch (cleanupFailure) {
          error = toScreeningError(cleanupFailure);
        }
      }
      if (generation !== this.generation) return;
      this.publish({
        ...this.state,
        status: "error",
        saveStatus: "idle",
        pendingAudioUri: uri,
        lastResult: null,
        completedAt: null,
        error,
      });
    } finally {
      if (generation === this.generation) this.controller = null;
    }
  }

  private async performSave(
    generation: number,
    payload: SaveScreeningPayload,
    saveAdapter: SaveScreeningAdapter,
  ) {
    if (this.savingInFlight) return;
    this.savingInFlight = true;
    try {
      if (
        !this.state.isDemo &&
        this.dependencies.isOnline &&
        !(await this.dependencies.isOnline())
      ) {
        throw requestFailure("offline");
      }
      await saveAdapter(payload);
      if (generation !== this.generation || this.state.status !== "success")
        return;
      this.pendingSavePayload = null;
      this.publish({ ...this.state, saveStatus: "saved" });
    } catch {
      if (generation !== this.generation || this.state.status !== "success")
        return;
      this.publish({ ...this.state, saveStatus: "save_failed" });
    } finally {
      if (generation === this.generation) this.savingInFlight = false;
    }
  }

  retrySave = () => {
    const saveAdapter = this.input?.save ?? this.activeSaveAdapter;
    if (
      this.savingInFlight ||
      this.state.status !== "success" ||
      this.state.saveStatus !== "save_failed" ||
      !this.pendingSavePayload ||
      !saveAdapter
    ) {
      return false;
    }
    this.publish({ ...this.state, saveStatus: "saving" });
    void this.performSave(
      this.generation,
      this.pendingSavePayload,
      saveAdapter,
    );
    return true;
  };

  retry = () => {
    if (
      this.clearingInFlight ||
      this.controller ||
      !this.input ||
      !this.state.error?.canRetrySameFile
    ) {
      return false;
    }
    void this.run(this.input);
    return true;
  };

  clear = async () => {
    if (this.clearingInFlight) return false;
    this.clearingInFlight = true;
    ++this.generation;
    this.controller?.abort();
    this.controller = null;
    this.input = null;
    this.pendingSavePayload = null;
    this.savingInFlight = false;
    const uri = this.state.pendingAudioUri;
    try {
      if (uri) await this.dependencies.cleanup(uri);
      this.publish(initial);
      return true;
    } catch (failure) {
      this.publish({
        ...initial,
        status: "error",
        pendingAudioUri: uri,
        error: toScreeningError(failure),
      });
      return false;
    } finally {
      this.clearingInFlight = false;
    }
  };
}
