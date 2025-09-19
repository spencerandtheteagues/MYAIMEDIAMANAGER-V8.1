import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, applyTheme, getStoredTheme, setStoredTheme } from '@/lib/theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  const setTheme = (newTheme: Theme) => {
    console.log('[ThemeContext] Setting theme to:', newTheme);
    setThemeState(newTheme);
    setStoredTheme(newTheme);
    applyTheme(newTheme);
  };

  // Apply theme on mount and when it changes
  useEffect(() => {
    console.log('[ThemeContext] Applying theme:', theme);
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}