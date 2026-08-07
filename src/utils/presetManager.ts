/**
 * @file presetManager.ts
 * @description Utility module for managing saved API Connection Presets.
 * Allows users to create, select, update, and delete custom connection configurations.
 */

import { ApiPreset } from "../types/preset";

const PRESETS_STORAGE_KEY = "agent_hub_api_presets";
const ACTIVE_PRESET_KEY = "agent_hub_active_preset_id";

export const DEFAULT_PRESETS: ApiPreset[] = [];

/**
 * Retrieve saved presets from localStorage.
 */
export function getSavedPresets(): ApiPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to parse saved API presets:", err);
  }
  return [];
}

/**
 * Save presets array to localStorage.
 */
export function savePresets(presets: ApiPreset[]): void {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.error("Failed to save API presets:", err);
  }
}

/**
 * Get active preset ID from localStorage.
 */
export function getActivePresetId(): string | null {
  return localStorage.getItem(ACTIVE_PRESET_KEY);
}

/**
 * Set active preset ID in localStorage.
 */
export function setActivePresetId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_PRESET_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_PRESET_KEY);
  }
}

/**
 * Add or update a preset. Returns updated list of presets.
 */
export function addOrUpdatePreset(preset: ApiPreset): ApiPreset[] {
  const current = getSavedPresets();
  const index = current.findIndex((p) => p.id === preset.id);
  let updated: ApiPreset[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = preset;
  } else {
    updated = [...current, preset];
  }
  savePresets(updated);
  setActivePresetId(preset.id);
  return updated;
}

/**
 * Delete a preset by ID. Returns updated list of presets.
 */
export function deletePreset(id: string): ApiPreset[] {
  const current = getSavedPresets();
  const updated = current.filter((p) => p.id !== id);
  savePresets(updated);
  if (getActivePresetId() === id) {
    setActivePresetId(updated.length > 0 ? updated[0].id : null);
  }
  return updated;
}
