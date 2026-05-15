// src/context/ThemeContext.jsx
// ─────────────────────────────────────────────────────────────────
// Dark mode context.
// Persists user preference in localStorage and toggles
// the 'dark' class on the document root element.
// ─────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('peblo_theme');
    if (stored) return stored === 'dark';
    // Default: respect OS preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply / remove 'dark' class on root element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('peblo_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
};
