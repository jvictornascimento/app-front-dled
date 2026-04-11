"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AccentKey = "ocean" | "ember" | "forest" | "ink";
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
  ocean: { accent: "#0e7490", strong: "#155e75", soft: "rgba(14, 116, 144, 0.14)" },
  ember: { accent: "#b45309", strong: "#92400e", soft: "rgba(180, 83, 9, 0.14)" },
  forest: { accent: "#0f766e", strong: "#115e59", soft: "rgba(15, 118, 110, 0.14)" },
  ink: { accent: "#334155", strong: "#1e293b", soft: "rgba(51, 65, 85, 0.16)" },
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const defaultSettings: ThemeSettings = {
  accent: "ocean",
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
