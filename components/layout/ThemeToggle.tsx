'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

// Theme only ever changes via toggleTheme() below (no external mutation
// source like a storage event to subscribe to), so this listener set exists
// purely to notify React after we write the DOM attribute + localStorage.
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((cb) => cb());
}
function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Theme {
  const stored = document.documentElement.getAttribute('data-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

// The real theme (OS preference / localStorage) is only knowable client-side
// -- null here avoids a hydration mismatch on the icon itself.
function getServerSnapshot(): Theme | null {
  return null;
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (theme === null) {
    return <span className="h-3.5 w-3.5" aria-hidden />;
  }

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    notify();
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      className="flex items-center gap-1.5 font-medium text-[var(--color-text-faint)] transition-colors hover:text-[var(--color-text)]"
    >
      {theme === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
    </button>
  );
}
