/**
 * @file customModels.ts
 * @description Helper functions for managing user-defined custom model names in localStorage.
 */

const CUSTOM_MODELS_KEY = "agent_hub_custom_models";

export function getSavedCustomModels(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MODELS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to parse saved custom models:", err);
  }
  return [];
}

export function saveCustomModel(modelName: string): string[] {
  const clean = modelName.trim();
  if (!clean) return getSavedCustomModels();
  const current = getSavedCustomModels();
  if (!current.includes(clean)) {
    const updated = [...current, clean];
    localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function removeCustomModel(modelName: string): string[] {
  const current = getSavedCustomModels();
  const updated = current.filter((m) => m !== modelName);
  localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(updated));
  return updated;
}
