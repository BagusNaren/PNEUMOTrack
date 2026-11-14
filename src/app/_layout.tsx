import "@/global.css";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useReduceMotion } from "@/components/screening/motion";
import { ThemeRoot } from "@/components/ui/theme-root";
import { type PropsWithChildren, useMemo } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActiveChildProvider, useActiveChild } from "@/hooks/use-active-child";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  type ActiveChildAdapter,
  ScreeningProvider,
} from "@/hooks/use-screening";
import { ProfileProvider } from "@/hooks/use-profile";
import { SessionProvider, useSession } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";
import { ThemePreferenceProvider } from "@/hooks/theme-preference";
import { screeningsService } from "@/services/screenings";
import { LoadingState } from "@/components/ui/loading-state";

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
  const parentId = user?.id ?? null;
  return (
    <ActiveChildProvider key={parentId ?? "guest"} parentId={parentId}>
      <ScreeningBridge>{children}</ScreeningBridge>
    </ActiveChildProvider>
  );
}

function AppProviders({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <ProfileProvider>
        <SessionBoundProviders>{children}</SessionBoundProviders>
      </ProfileProvider>
    </SessionProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <ThemedLayout />
    </ThemePreferenceProvider>
  );
}

function AppNavigator() {
  const { user, isLoading } = useSession();
  const colors = useTheme();
  const reducedMotion = useReduceMotion();
  if (isLoading) return <LoadingState />;
  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: Platform.OS === "web" || reducedMotion ? "none" : "slide_from_right",
      contentStyle: { backgroundColor: colors.surface },
    }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!user}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="children/new" />
        <Stack.Screen name="screening/guide" />
        <Stack.Screen name="screening/record" />
        <Stack.Screen name="screening/analyzing" />
        <Stack.Screen name="screening/result" />
        <Stack.Screen name="history/index" />
        <Stack.Screen name="history/[id]" />
        <Stack.Screen name="recommendation" />
        <Stack.Screen name="doctors/index" />
        <Stack.Screen name="doctors/[id]" />
        <Stack.Screen name="chats/index" />
        <Stack.Screen name="chats/[id]" />
        <Stack.Screen name="hospitals/index" />
        <Stack.Screen name="hospitals/map" />
        <Stack.Screen name="articles/index" />
        <Stack.Screen name="articles/[id]" />
        <Stack.Screen name="dev/components" />
      </Stack.Protected>
    </Stack>
  );
}

function ThemedLayout() {
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
              <AppNavigator />
            </ThemeProvider>
          </AppProviders>
        </ThemeRoot>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
