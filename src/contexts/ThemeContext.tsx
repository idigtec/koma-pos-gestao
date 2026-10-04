import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode, DisplayMode, ThemeContextType } from '../types/theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('pos_theme_mode') as ThemeMode) || 'light';
  });

  const [displayMode, setDisplayModeState] = useState<DisplayMode>(() => {
    return (localStorage.getItem('pos_display_mode') as DisplayMode) || 'touch';
  });

  useEffect(() => {
    localStorage.setItem('pos_theme_mode', theme);
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('pos_display_mode', displayMode);
    const body = document.body;
    if (displayMode === 'touch') {
      body.classList.add('touch-mode');
      body.classList.remove('compact-mode');
    } else {
      body.classList.add('compact-mode');
      body.classList.remove('touch-mode');
    }
  }, [displayMode]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const setDisplayMode = (newMode: DisplayMode) => {
    setDisplayModeState(newMode);
  };

  const toggleDisplayMode = () => {
    setDisplayModeState(prev => (prev === 'touch' ? 'compact' : 'touch'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, displayMode, setDisplayMode, toggleDisplayMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
