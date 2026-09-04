'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeValue {
  dark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeValue>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('reachly_theme');
    if (stored === 'dark') setDark(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    window.localStorage.setItem('reachly_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
