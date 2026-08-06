/**
 * @file safeEnv.ts
 * @description Safe utility functions for accessing server/build environment variables
 * without throwing "process is not defined" ReferenceErrors in client-side Vite builds.
 *
 * Exports:
 * - getEnvOpenAIKey(): Safely checks for any pre-configured OpenAI key.
 */

export function getEnvOpenAIKey(): string {
  try {
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.OPENAI_API_KEY
    ) {
      return process.env.OPENAI_API_KEY;
    }
  } catch (e) {
    // Suppress reference errors in certain sandboxes
  }
  return "";
}
