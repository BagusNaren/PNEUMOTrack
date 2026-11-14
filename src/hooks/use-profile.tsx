import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useSession } from "@/hooks/use-session";

export interface LocalProfile {
  fullName: string;
  phone: string;
  city: string;
  avatarUri: string | null;
}

interface ProfileContextValue {
  profile: LocalProfile;
  isReady: boolean;
  loadError: boolean;
  retryLoad: () => void;
  updateProfile: (input: Partial<LocalProfile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function readStoredProfile(value: string | null): Partial<LocalProfile> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null) return {};
    const record = parsed as Record<string, unknown>;
    return {
      fullName:
        typeof record.fullName === "string" ? record.fullName : undefined,
      phone: typeof record.phone === "string" ? record.phone : undefined,
      city: typeof record.city === "string" ? record.city : undefined,
      avatarUri:
        typeof record.avatarUri === "string" ? record.avatarUri : undefined,
    };
  } catch {
    return {};
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const metadataName = user?.user_metadata?.full_name?.trim() ?? "";
  const storageKey = `pneumo:profile:${userId ?? "guest"}`;
  const defaults = useMemo<LocalProfile>(
    () => ({
      fullName: metadataName,
      phone: "",
      city: "",
      avatarUri: null,
    }),
    [metadataName],
  );
  const [state, setState] = useState<{
    userId: string | null;
    profile: LocalProfile;
    isReady: boolean;
    loadError: boolean;
  }>({ userId, profile: defaults, isReady: false, loadError: false });
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (!active) return;
        const parsed = readStoredProfile(stored);
        setState({
          userId,
          profile: {
            fullName: parsed.fullName?.trim() || defaults.fullName,
            phone: parsed.phone ?? "",
            city: parsed.city ?? "",
            avatarUri: parsed.avatarUri ?? null,
          },
          isReady: true,
          loadError: false,
        });
      })
      .catch(() => {
        if (active) setState({ userId, profile: defaults, isReady: true, loadError: true });
      });
    return () => {
      active = false;
    };
  }, [defaults, storageKey, userId, loadAttempt]);

  const current = state.userId === userId;
  const profile = current ? state.profile : defaults;
  const isReady = current && state.isReady;

  const updateProfile = useCallback(
    async (input: Partial<LocalProfile>) => {
      if (!isReady || state.loadError) throw new Error("Stored profile is unavailable");
      const next: LocalProfile = {
        ...profile,
        ...input,
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      setState((previous) => previous.userId === userId
        ? { userId, profile: next, isReady: true, loadError: false }
        : previous);
    },
    [isReady, state.loadError, profile, storageKey, userId],
  );

  return (
    <ProfileContext.Provider value={{
      profile, isReady, updateProfile,
      loadError: current && state.loadError,
      retryLoad: () => setLoadAttempt((attempt) => attempt + 1),
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
}
