export const THEME_STORAGE_KEY = "algoaliens-theme"

export const APP_THEMES = [
  {
    description: "Deep slate enterprise dark",
    id: "enterprise-dark",
    label: "Enterprise Dark",
    mode: "dark",
  },
  {
    description: "Clean white SaaS workspace",
    id: "clean-saas",
    label: "Clean SaaS",
    mode: "light",
  },
  {
    description: "Immersive midnight glass",
    id: "midnight-violet",
    label: "Midnight Violet",
    mode: "dark",
  },
  {
    description: "OLED black high contrast",
    id: "oled-black",
    label: "OLED Black",
    mode: "dark",
  },
  {
    description: "Polished silver executive",
    id: "silver-executive",
    label: "Silver Executive",
    mode: "light",
  },
] as const

export type AppThemeId = (typeof APP_THEMES)[number]["id"]

export const DEFAULT_APP_THEME: AppThemeId = "enterprise-dark"

export function isAppThemeId(value: string | null | undefined): value is AppThemeId {
  return APP_THEMES.some((theme) => theme.id === value)
}

export function isLightTheme(theme: AppThemeId) {
  return APP_THEMES.find((option) => option.id === theme)?.mode === "light"
}

export function getMonacoTheme(theme: AppThemeId) {
  switch (theme) {
    case "clean-saas":
    case "silver-executive":
      return "vs"
    case "oled-black":
      return "hc-black"
    default:
      return "vs-dark"
  }
}
