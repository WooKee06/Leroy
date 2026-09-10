import { makeAutoObservable } from 'mobx';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';

function readStored(): Theme {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return t === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function applyToDocument(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

class ThemeStore {
  theme: Theme = 'dark';

  constructor() {
    makeAutoObservable(this);
  }

  initialize() {
    this.theme = readStored();
    applyToDocument(this.theme);
  }

  setTheme(theme: Theme) {
    this.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* noop */
    }
    applyToDocument(theme);
  }

  toggle() {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  get isDark() {
    return this.theme === 'dark';
  }
}

export const themeStore = new ThemeStore();