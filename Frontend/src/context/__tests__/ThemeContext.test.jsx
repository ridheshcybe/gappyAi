import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock document.documentElement.classList
document.documentElement.classList.add = vi.fn();
document.documentElement.classList.remove = vi.fn();

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should default to dark mode when no theme stored', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.darkMode).toBe(true);
  });

  it('should read dark theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.darkMode).toBe(true);
  });

  it('should read light theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('light');
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.darkMode).toBe(false);
  });

  it('should toggle theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.darkMode).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.darkMode).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  it('should add/remove CSS classes on theme change', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.toggleTheme();
    });

    expect(document.documentElement.classList.add).toHaveBeenCalledWith('light');
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
  });

  it('should persist theme to localStorage on toggle', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
});
