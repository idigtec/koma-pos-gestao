export type ThemeMode = 'light' | 'dark' | 'system';
export type DisplayMode = 'touch' | 'compact';

export interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  toggleDisplayMode: () => void;
}
