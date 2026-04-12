"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AccentKey = "brand" | "ruby" | "graphite" | "oxide";
type DensityKey = "compact" | "comfortable" | "spacious";

interface ThemeSettings {
  accent: AccentKey;
  density: DensityKey;
  contentWidth: "normal" | "wide";
}

interface ThemeContextValue {
  settings: ThemeSettings;
  setSettings: (settings: ThemeSettings) => void;
}

const STORAGE_KEY = "dled-control-theme";

const accentMap: Record<AccentKey, { accent: string; strong: string; soft: string }> = {
  brand: { accent: "#c61616", strong: "#8f1010", soft: "rgba(198, 22, 22, 0.14)" },
  ruby: { accent: "#9f1239", strong: "#881337", soft: "rgba(159, 18, 57, 0.14)" },
  graphite: { accent: "#161616", strong: "#2c2c2c", soft: "rgba(22, 22, 22, 0.14)" },
  oxide: { accent: "#b91c1c", strong: "#7f1d1d", soft: "rgba(185, 28, 28, 0.14)" },
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const defaultSettings: ThemeSettings = {
  accent: "brand",
  density: "comfortable",
  contentWidth: "wide",
};

function applySettings(settings: ThemeSettings) {
  const root = document.documentElement;
  const accent = accentMap[settings.accent];
  root.style.setProperty("--accent", accent.accent);
  root.style.setProperty("--accent-strong", accent.strong);
  root.style.setProperty("--accent-soft", accent.soft);
  root.style.setProperty("--content-width", settings.contentWidth === "wide" ? "1720px" : "1440px");
  root.dataset.density = settings.density;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<ThemeSettings>(() => {
    if (typeof window === "undefined") {
      return defaultSettings;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as ThemeSettings) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      settings,
      setSettings(nextSettings) {
        setSettingsState(nextSettings);
        applySettings(nextSettings);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
      },
    }),
    [settings],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeSettings() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeSettings must be used within ThemeProvider");
  }

  return context;
}
