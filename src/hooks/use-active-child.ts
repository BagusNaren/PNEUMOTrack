// src/hooks/use-active-child.ts
// Persists the "active child" selection in AsyncStorage and exposes it via Context.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { childrenService } from '@/services/children';
import type { Child } from '@/types/domain';

const STORAGE_KEY = 'pneumo:active_child_id';

interface ActiveChildContextValue {
  activeChild: Child | null;
  children: Child[];
  isLoading: boolean;
  setActiveChild: (child: Child) => void;
  refresh: () => Promise<void>;
}

const ActiveChildContext = createContext<ActiveChildContextValue | null>(null);

export function ActiveChildProvider({
  children: reactChildren,
  parentId,
}: {
  children: ReactNode;
  parentId: string | null;
}) {
  const [activeChild, setActiveChildState] = useState<Child | null>(null);
  const [childList, setChildList] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!parentId) {
      setChildList([]);
      setActiveChildState(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const list = await childrenService.list(parentId);
      setChildList(list);

      const storedId = await AsyncStorage.getItem(STORAGE_KEY);
      const restored = list.find((c) => c.id === storedId) ?? list[0] ?? null;
      setActiveChildState(restored);
    } catch {
      // silently fail — UI handles empty state
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setActiveChild = useCallback((child: Child) => {
    setActiveChildState(child);
    AsyncStorage.setItem(STORAGE_KEY, child.id).catch(() => {});
  }, []);

  return (
    <ActiveChildContext.Provider
      value={{
        activeChild,
        children: childList,
        isLoading,
        setActiveChild,
        refresh,
      }}
    >
      {reactChildren}
    </ActiveChildContext.Provider>
  );
}

export function useActiveChild(): ActiveChildContextValue {
  const ctx = useContext(ActiveChildContext);
  if (!ctx) throw new Error('useActiveChild must be used within ActiveChildProvider');
  return ctx;
}
