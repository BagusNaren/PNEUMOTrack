import "@/global.css";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeRoot } from "@/components/ui/theme-root";
import { type PropsWithChildren, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActiveChildProvider, useActiveChild } from "@/hooks/use-active-child";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  type ActiveChildAdapter,
  ScreeningProvider,
} from "@/hooks/use-screening";
import { SessionProvider, useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { screeningsService } from "@/services/screenings";

function formatChildAgeLabel(birthDateStr: string): string {
  const birth = new Date(birthDateStr);
  if (Number.isNaN(birth.getTime())) return birthDateStr;
  const now = new Date();
  const totalMonths = Math.max(
    0,
    (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth()),
  );
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0 && months > 0) return `${years} tahun ${months} bulan`;
  if (years > 0) return `${years} tahun`;
  return `${months} bulan`;
}

function ScreeningBridge({ children }: PropsWithChildren) {
  const { activeChild, isLoading, error, refresh } = useActiveChild();
  const adapter = useMemo<ActiveChildAdapter>(() => {
    if (error)
      return {
        status: "error",
        child: null,
        onRetry: () => {
          void refresh();
        },
      };
    if (isLoading) {
      return { status: "loading", child: null };
    }
    if (!activeChild) {
      return { status: "empty", child: null };
    }
    return {
      status: "ready",
      child: {
        id: activeChild.id,
        name: activeChild.name,
        ageLabel: formatChildAgeLabel(activeChild.birth_date),
      },
    };
  }, [activeChild, isLoading, error, refresh]);

  return (
    <ScreeningProvider
      activeChild={adapter}
      saveScreening={screeningsService.save}
    >
      {children}
    </ScreeningProvider>
  );
}

function SessionBoundProviders({ children }: PropsWithChildren) {
  const { user } = useSession();
  return (
    <ActiveChildProvider parentId={user?.id ?? null}>
      <ScreeningBridge>{children}</ScreeningBridge>
    </ActiveChildProvider>
  );
}

function AppProviders({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <SessionBoundProviders>{children}</SessionBoundProviders>
    </SessionProvider>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = useTheme();
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeRoot>
          <AppProviders>
            <ThemeProvider
              value={{
                ...base,
                colors: {
                  ...base.colors,
                  background: colors.surface,
                  card: colors.surfaceCard,
                  text: colors.ink,
                  primary: colors.brand,
                  border: colors.border,
                },
              }}
            >
              <StatusBar style="auto" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "none",
                  contentStyle: { backgroundColor: colors.surface },
                }}
              />
            </ThemeProvider>
          </AppProviders>
        </ThemeRoot>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
