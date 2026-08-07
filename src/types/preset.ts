/**
 * @file preset.ts
 * @description Type definitions for API Connection Profiles / Presets.
 */

export interface ApiPreset {
  id: string;
  name: string;
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  temperature?: string;
  isDefault?: boolean;
}
