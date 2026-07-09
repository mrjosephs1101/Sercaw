import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SercawSettings {
  theme: Theme;
  fontSize: FontSize;
  reduceMotion: boolean;
  highContrast: boolean;
  underlineLinks: boolean;
  openResultsInNewTab: boolean;
}

const DEFAULT_SETTINGS: SercawSettings = {
  theme: 'system',
  fontSize: 'md',
  reduceMotion: false,
  highContrast: false,
  underlineLinks: false,
  openResultsInNewTab: false,
};

const STORAGE_KEY = 'sercaw:settings';

const THEMES: Theme[] = ['light', 'dark', 'system'];
const FONT_SIZES: FontSize[] = ['sm', 'md', 'lg', 'xl'];

function sanitize(parsed: unknown): SercawSettings {
  const p = (parsed && typeof parsed === 'object' ? parsed : {}) as Partial<SercawSettings>;
  return {
    theme: THEMES.includes(p.theme as Theme) ? (p.theme as Theme) : DEFAULT_SETTINGS.theme,
    fontSize: FONT_SIZES.includes(p.fontSize as FontSize)
      ? (p.fontSize as FontSize)
      : DEFAULT_SETTINGS.fontSize,
    reduceMotion: typeof p.reduceMotion === 'boolean' ? p.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
    highContrast: typeof p.highContrast === 'boolean' ? p.highContrast : DEFAULT_SETTINGS.highContrast,
    underlineLinks:
      typeof p.underlineLinks === 'boolean' ? p.underlineLinks : DEFAULT_SETTINGS.underlineLinks,
    openResultsInNewTab:
      typeof p.openResultsInNewTab === 'boolean'
        ? p.openResultsInNewTab
        : DEFAULT_SETTINGS.openResultsInNewTab,
  };
}

function loadSettings(): SercawSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return sanitize(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

interface SettingsContextValue {
  settings: SercawSettings;
  setSetting: <K extends keyof SercawSettings>(key: K, value: SercawSettings[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const FONT_SIZE_PX: Record<FontSize, string> = {
  sm: '15px',
  md: '16px',
  lg: '18px',
  xl: '20px',
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SercawSettings>(() => loadSettings());

  // Persist on change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage failures (e.g. private browsing quota).
    }
  }, [settings]);

  // Apply theme: resolve "system" via matchMedia and react to OS changes live.
  useEffect(() => {
    const root = document.documentElement;
    const apply = (isDark: boolean) => root.classList.toggle('dark', isDark);

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches);
      const listener = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }

    apply(settings.theme === 'dark');
    return undefined;
  }, [settings.theme]);

  // Apply accessibility + typography settings as root-level attributes/classes.
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = FONT_SIZE_PX[settings.fontSize];
    root.classList.toggle('reduce-motion', settings.reduceMotion);
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('underline-links', settings.underlineLinks);
  }, [settings.fontSize, settings.reduceMotion, settings.highContrast, settings.underlineLinks]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      setSetting: (key, val) => setSettings((prev) => ({ ...prev, [key]: val })),
      resetSettings: () => setSettings(DEFAULT_SETTINGS),
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
