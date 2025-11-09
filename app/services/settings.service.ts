import type { SettingsModel } from "../types/domain/settingsModel.type";
import { settingsDefault } from "../defaults/settings.default";

const SETTINGS_KEY = "buddy:settings";

export const settingsService = {
  get(): SettingsModel {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (!stored) {
        return settingsDefault;
      }
      return JSON.parse(stored) as SettingsModel;
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
      return settingsDefault;
    }
  },

  setLanguage(language: SettingsModel["language"]): void {
    const currentSettings = this.get();
    const updatedSettings = { ...currentSettings, language };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
  },
};
