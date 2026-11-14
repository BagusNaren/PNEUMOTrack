import { useThemePreference } from "./theme-preference";
export function useColorScheme() { return useThemePreference().scheme; }
