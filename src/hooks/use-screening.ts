import {
  createContext,
  createElement,
  use,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { config } from "@/constants/config";
import { copy } from "@/constants/copy";
import { cleanupAudioFile } from "@/services/api/audio-file";
import { checkIsOnline, useIsOnline } from "@/services/api/connectivity";
import { triggerRiskResultHaptic } from "@/services/api/haptics";
import { predictCough } from "@/services/api/screening";
import { mockPredict, type MockScenario } from "@/services/api/screening.mock";
import { ScreeningSession } from "@/services/api/screening-session";
import type { SaveScreeningAdapter } from "@/types/screening";

export type ActiveScreeningChild = {
  id: string;
  name: string;
  ageLabel: string;
  isPreview?: boolean;
};
export type ActiveChildAdapter =
  | { status: "ready"; child: ActiveScreeningChild }
  | { status: "empty"; child: null }
  | { status: "loading"; child: null }
  | { status: "error"; child: null; onRetry: () => void };

export type DevSaveMode = "disabled" | "saved" | "save_failed";
export const devSaveModes: readonly DevSaveMode[] = [
  "disabled",
  "saved",
  "save_failed",
];

const DEV_SIMULATION_CHILD_UUID = "00000000-0000-4000-8000-000000000001";

const defaultSaveAdapter: SaveScreeningAdapter = async () => {
  if (config.useMockData) {
    return;
  }
  throw new Error("Screenings save service is not connected");
};

const previewChild: ActiveChildAdapter = {
  status: "ready",
  child: {
    id: "demo-child",
    name: copy.guide.previewChild,
    ageLabel: copy.guide.previewAge,
    isPreview: true,
  },
};

function useScreeningState(
  activeChild: ActiveChildAdapter,
  saveScreening?: SaveScreeningAdapter,
) {
  const isOnline = useIsOnline();
  const [devMockScenario, setDevMockScenario] =
    useState<MockScenario>("normal");
  const [devSaveMode, setDevSaveMode] = useState<DevSaveMode>("disabled");

  const [session] = useState(
    () =>
      new ScreeningSession({
        cleanup: cleanupAudioFile,
        isOnline: checkIsOnline,
        save: defaultSaveAdapter,
        onRiskResult: () => {
          void triggerRiskResultHaptic();
        },
        predict: (input, signal, onResponse) => {
          if (__DEV__ && !input.audioUri)
            return mockPredict({
              scenario: input.scenario,
              signal,
              onResponse,
            });
          if (!input.audioUri) throw new Error("Missing recording");
          return predictCough({
            audioUri: input.audioUri,
            childId: input.childId,
            signal,
            onResponse,
            mockScenario: input.scenario,
          });
        },
      }),
  );

  useEffect(() => {
    session.setSaveAdapter(saveScreening ?? defaultSaveAdapter);
  }, [session, saveScreening]);

  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  useEffect(
    () => () => {
      void session.clear();
    },
    [session],
  );
  const cleanupAnalysisOnLeave = useCallback(() => {
    if (session.getSnapshot().status !== "success") void session.clear();
  }, [session]);
  return {
    ...snapshot,
    isOnline,
    activeChild,
    devMockScenario: __DEV__ ? devMockScenario : undefined,
    setDevMockScenario: (scenario: MockScenario) => {
      if (__DEV__) setDevMockScenario(scenario);
    },
    devSaveMode: __DEV__ ? devSaveMode : undefined,
    setDevSaveMode: (mode: DevSaveMode) => {
      if (__DEV__) setDevSaveMode(mode);
    },
    startAnalysis: (audioUri: string, childId?: string) =>
      session.start({
        audioUri,
        childId,
        simulation: config.useMockApi,
        scenario: __DEV__ ? devMockScenario : undefined,
      }),
    startDevSimulation: () => {
      if (!__DEV__) return false;
      let attempts = 0;
      const simulatedSave: SaveScreeningAdapter | undefined =
        devSaveMode === "disabled"
          ? undefined
          : async () => {
              attempts += 1;
              if (devSaveMode === "save_failed" && attempts === 1) {
                throw new Error("Simulated history save failure");
              }
            };
      return session.start({
        audioUri: null,
        childId:
          devSaveMode !== "disabled" ? DEV_SIMULATION_CHILD_UUID : undefined,
        simulation: true,
        scenario: devMockScenario,
        save: simulatedSave,
      });
    },
    retryAnalysis: session.retry,
    retrySave: session.retrySave,
    cancelAnalysis: session.clear,
    clearSession: session.clear,
    cleanupAnalysisOnLeave,
  };
}

const ScreeningContext = createContext<ReturnType<
  typeof useScreeningState
> | null>(null);

// Member C can pass its resolved child state and screeningsService.save adapter here.
export function ScreeningProvider({
  children,
  activeChild = previewChild,
  saveScreening,
}: PropsWithChildren<{
  activeChild?: ActiveChildAdapter;
  saveScreening?: SaveScreeningAdapter;
}>) {
  const value = useScreeningState(activeChild, saveScreening);
  return createElement(ScreeningContext.Provider, { value }, children);
}

export function useScreening() {
  const context = use(ScreeningContext);
  if (!context) throw new Error("ScreeningProvider is required");
  return context;
}
