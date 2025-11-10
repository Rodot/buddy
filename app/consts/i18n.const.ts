export const LANGUAGES = [
  { code: "en", name: "🇬🇧 English" },
  { code: "zh", name: "🇨🇳 中文" },
  { code: "es", name: "🇪🇸 Español" },
  { code: "ar", name: "🇸🇦 العربية" },
  { code: "pt", name: "🇵🇹 Português" },
  { code: "id", name: "🇮🇩 Indonesia" },
  { code: "fr", name: "🇫🇷 Français" },
  { code: "ja", name: "🇯🇵 日本語" },
  { code: "ru", name: "🇷🇺 Русский" },
  { code: "de", name: "🇩🇪 Deutsch" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: Language = "en";
