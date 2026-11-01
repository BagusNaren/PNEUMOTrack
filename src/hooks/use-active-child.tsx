import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { childrenService } from "@/services/children";
import type { Child } from "@/types/domain";

interface ActiveChildContextValue {
  activeChild: Child | null;
  children: Child[];
  isLoading: boolean;
  error: boolean;
  setActiveChild: (child: Child) => void;
  refresh: () => Promise<void>;
}

const ActiveChildContext = createContext<ActiveChildContextValue | null>(null);

export function ActiveChildProvider({
  children,
  parentId,
}: {
  children: ReactNode;
  parentId: string | null;
}) {
  const request = useRef(0);
  const storageKey = `pneumo:active_child_id:${parentId ?? "none"}`;
  const [state, setState] = useState<{
    parentId: string | null;
    children: Child[];
    activeChild: Child | null;
    isLoading: boolean;
    error: boolean;
  }>({
    parentId,
    children: [],
    activeChild: null,
    isLoading: true,
    error: false,
  });

  const refresh = useCallback(async () => {
    const current = ++request.current;
    setState((previous) => ({
      parentId,
      children: previous.parentId === parentId ? previous.children : [],
      activeChild: previous.parentId === parentId ? previous.activeChild : null,
      isLoading: true,
      error: false,
    }));
    try {
      const [list, storedId] = parentId
        ? await Promise.all([
            childrenService.list(parentId),
            AsyncStorage.getItem(storageKey),
          ])
        : ([[], null] as const);
      if (request.current !== current) return;
      setState({
        parentId,
        children: [...list],
        activeChild:
          list.find((child) => child.id === storedId) ?? list[0] ?? null,
        isLoading: false,
        error: false,
      });
    } catch {
      if (request.current === current)
        setState((previous) => ({
          ...previous,
          isLoading: false,
          error: true,
        }));
    }
  }, [parentId, storageKey]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void refresh();
    });
    return () => {
      cancelled = true;
      request.current += 1;
    };
  }, [refresh]);

  const setActiveChild = useCallback(
    (child: Child) => {
      setState((previous) =>
        previous.parentId === parentId &&
        previous.children.some((item) => item.id === child.id)
          ? { ...previous, activeChild: child }
          : previous,
      );
      void AsyncStorage.setItem(storageKey, child.id).catch(() => {});
    },
    [parentId, storageKey],
  );

  const current = state.parentId === parentId;
  return (
    <ActiveChildContext.Provider
      value={{
        activeChild: current ? state.activeChild : null,
        children: current ? state.children : [],
        isLoading: !current || state.isLoading,
        error: current && state.error,
        setActiveChild,
        refresh,
      }}
    >
      {children}
    </ActiveChildContext.Provider>
  );
}

export function useActiveChild(): ActiveChildContextValue {
  const context = useContext(ActiveChildContext);
  if (!context)
    throw new Error("useActiveChild must be used within ActiveChildProvider");
  return context;
}
