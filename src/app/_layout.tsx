import "@/global.css";

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { ScreeningProvider } from "@/hooks/use-screening";

// Member C can insert SessionProvider here without changing the navigation tree.
function AppProviders({ children }: PropsWithChildren) {
  return <ScreeningProvider>{children}</ScreeningProvider>;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = useTheme();
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
