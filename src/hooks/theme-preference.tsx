import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { useColorScheme as useDeviceScheme } from "react-native";

export type ThemePreference = "system" | "light" | "dark";
const storageKey = "pneumo:theme_preference";
const ThemeContext = createContext({
  preference: "light" as ThemePreference,
  scheme: "light" as "light" | "dark",
  setPreference: (_value: ThemePreference) => {},
});

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const deviceScheme = useDeviceScheme();
  const [preference, setValue] = useState<ThemePreference>("light");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(storageKey).then((value) => {
      if (active && (value === "system" || value === "light" || value === "dark")) setValue(value);
    }).catch(() => {}).finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);
  const scheme = preference === "system" ? (hydrated ? deviceScheme ?? "light" : "light") : preference;
  function setPreference(value: ThemePreference) {
    setValue(value);
    void AsyncStorage.setItem(storageKey, value).catch(() => {});
  }
  return <ThemeContext.Provider value={{ preference, scheme, setPreference }}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() { return useContext(ThemeContext); }
