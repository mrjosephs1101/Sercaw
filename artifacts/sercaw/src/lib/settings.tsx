import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type SnippetLength = 'short' | 'medium' | 'full';
export type AccentColor = 'sunset' | 'ocean' | 'forest' | 'aurora';

export interface SercawSettings {
  theme: Theme;
  fontSize: FontSize;
  reduceMotion: boolean;
  highContrast: boolean;
  underlineLinks: boolean;
  openResultsInNewTab: boolean;
  showAiOverview: boolean;
  compactResults: boolean;
  snippetLength: SnippetLength;
  accentColor: AccentColor;
  stickyHeader: boolean;
}

const DEFAULT_SETTINGS: SercawSettings = {
  theme: 'system',
  fontSize: 'md',
  reduceMotion: false,
  highContrast: false,
  underlineLinks: false,
  openResultsInNewTab: false,
  showAiOverview: true,
  compactResults: false,
  snippetLength: 'medium',
  accentColor: 'sunset',
  stickyHeader: true,
};

const STORAGE_KEY = 'sercaw:settings';

const THEMES: Theme[] = ['light', 'dark', 'system'];
const FONT_SIZES: FontSize[] = ['sm', 'md', 'lg', 'xl'];
const SNIPPET_LENGTHS: SnippetLength[] = ['short', 'medium', 'full'];
const ACCENT_COLORS: AccentColor[] = ['sunset', 'ocean', 'forest', 'aurora'];

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
    showAiOverview:
      typeof p.showAiOverview === 'boolean' ? p.showAiOverview : DEFAULT_SETTINGS.showAiOverview,
    compactResults:
      typeof p.compactResults === 'boolean' ? p.compactResults : DEFAULT_SETTINGS.compactResults,
    snippetLength: SNIPPET_LENGTHS.includes(p.snippetLength as SnippetLength)
      ? (p.snippetLength as SnippetLength)
      : DEFAULT_SETTINGS.snippetLength,
    accentColor: ACCENT_COLORS.includes(p.accentColor as AccentColor)
      ? (p.accentColor as AccentColor)
      : DEFAULT_SETTINGS.accentColor,
    stickyHeader:
      typeof p.stickyHeader === 'boolean' ? p.stickyHeader : DEFAULT_SETTINGS.stickyHeader,
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

const ACCENT_CLASSES: Record<AccentColor, string> = {
  sunset: '',
  ocean: 'accent-ocean',
  forest: 'accent-forest',
  aurora: 'accent-aurora',
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

  // Apply accent color as a root class.
  useEffect(() => {
    const root = document.documentElement;
    Object.values(ACCENT_CLASSES).forEach((cls) => {
      if (cls) root.classList.remove(cls);
    });
    const cls = ACCENT_CLASSES[settings.accentColor];
    if (cls) root.classList.add(cls);
  }, [settings.accentColor]);

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
