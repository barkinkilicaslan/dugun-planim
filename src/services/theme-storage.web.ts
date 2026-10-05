import { isThemeId, type ThemeId } from '@/constants/themes';

/** Web önizlemesinde tarz tercihi `localStorage` içinde tutulur. */
const KEY = 'dugun-planim.theme';

export function loadThemeId(): ThemeId | null {
  try {
    const stored = localStorage.getItem(KEY);
    return isThemeId(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function saveThemeId(id: ThemeId): boolean {
  try {
    localStorage.setItem(KEY, id);
    return true;
  } catch {
    return false;
  }
}

export function clearThemeId(): boolean {
  try {
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
