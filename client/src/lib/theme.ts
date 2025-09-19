// Theme management utilities
export type Theme = 'neon-pink' | 'neon-blue' | 'professional';

const THEME_KEY = 'app-theme';
const VALID_THEMES: Theme[] = ['neon-pink', 'neon-blue', 'professional'];

export function isValidTheme(theme: string): theme is Theme {
  return VALID_THEMES.includes(theme as Theme);
}

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && isValidTheme(stored)) {
      return stored;
    }
  } catch {
    // localStorage might not be available
  }
  return 'neon-pink'; // default theme
}

export function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // localStorage might not be available
  }
}

export function applyTheme(theme: Theme): void {
  // Apply theme to document root
  document.documentElement.setAttribute('data-theme', theme);

  // Also update any theme-specific classes if needed
  document.documentElement.classList.remove('theme-neon-pink', 'theme-neon-blue', 'theme-professional');
  document.documentElement.classList.add(`theme-${theme}`);
}

export function initializeTheme(): Theme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}