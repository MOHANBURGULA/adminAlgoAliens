"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import {
  APP_THEMES,
  DEFAULT_APP_THEME,
  THEME_STORAGE_KEY,
  isAppThemeId,
  isLightTheme,
  type AppThemeId,
} from "@/lib/theme"

type ThemeContextValue = {
  setTheme: (theme: AppThemeId) => void
  theme: AppThemeId
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const THEME_SYNC_EVENT = "algoaliens:theme-change"

function readStoredTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_APP_THEME
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isAppThemeId(storedTheme) ? storedTheme : DEFAULT_APP_THEME
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const handleStorageChange = (event: StorageEvent) => {
    if (!event.key || event.key === THEME_STORAGE_KEY) {
      onStoreChange()
    }
  }

  const handleThemeChange = () => {
    onStoreChange()
  }

  window.addEventListener("storage", handleStorageChange)
  window.addEventListener(THEME_SYNC_EVENT, handleThemeChange)

  return () => {
    window.removeEventListener("storage", handleStorageChange)
    window.removeEventListener(THEME_SYNC_EVENT, handleThemeChange)
  }
}

function persistTheme(theme: AppThemeId) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  window.dispatchEvent(new Event(THEME_SYNC_EVENT))
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToThemeChanges,
    readStoredTheme,
    () => DEFAULT_APP_THEME,
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = isLightTheme(theme) ? "light" : "dark"
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      setTheme: (nextTheme) => {
        if (nextTheme !== theme) {
          persistTheme(nextTheme)
        }
      },
      theme,
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useAppTheme must be used within ThemeProvider")
  }

  return context
}

export { APP_THEMES }
