import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

export function useResource<T>(loader: () => Promise<T>) {
  const request = useRef(0);
  const [state, setState] = useState<{
    loader: typeof loader;
    data?: T;
    loading: boolean;
    error: boolean;
  }>({ loader, loading: true, error: false });

  const reload = useCallback(async () => {
    const current = ++request.current;
    setState((previous) => ({
      loader,
      data: previous.loader === loader ? previous.data : undefined,
      loading: true,
      error: false,
    }));
    try {
      const data = await loader();
      if (current === request.current)
        setState({ loader, data, loading: false, error: false });
    } catch {
      if (current === request.current) {
        setState((previous) => ({ ...previous, loading: false, error: true }));
      }
    }
  }, [loader]);

  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        request.current += 1;
      };
    }, [reload]),
  );

  const data = state.loader === loader ? state.data : undefined;
  return {
    data,
    error: state.loader === loader && state.error,
    isLoading: state.loader !== loader || (state.loading && data === undefined),
    isRefreshing:
      state.loader === loader && state.loading && data !== undefined,
    reload,
  };
}
