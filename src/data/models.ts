/**
 * @file models.ts
 * @description Curated, authoritative list of real AI models available for execution,
 * categorized into Reasoning/Thinking Models, Flagship Multimodal Models, and Fast Models.
 *
 * Exports:
 * - AVAILABLE_MODELS: Array of real supported model definitions.
 * - THINKING_MODELS: Array of model IDs explicitly supporting reasoning/thinking output.
 * - getModelDetails: Helper to retrieve metadata for a model ID.
 */

export interface ModelOption {
  id: string;
  name: string;
  provider: "OpenAI" | "Anthropic" | "DeepSeek" | "Custom";
  type: "reasoning" | "multimodal" | "standard" | "fast";
  description: string;
  supportsReasoning: boolean;
  supportsTools: boolean;
}

/**
 * Real, production AI models supported by OpenAI-compatible APIs.
 * Strictly no fabricated model names.
 */
export const AVAILABLE_MODELS: ModelOption[] = [
  // --- Thinking / Reasoning Models ---
  {
    id: "o3-mini",
    name: "OpenAI o3-mini",
    provider: "OpenAI",
    type: "reasoning",
    description:
      "High-speed reasoning model specialized in STEM, coding, and multi-step logic with reasoning tokens.",
    supportsReasoning: true,
    supportsTools: true,
  },
  {
    id: "o1",
    name: "OpenAI o1",
    provider: "OpenAI",
    type: "reasoning",
    description:
      "Flagship reasoning model for complex scientific problem solving and deep strategic planning.",
    supportsReasoning: true,
    supportsTools: true,
  },
  {
    id: "o1-mini",
    name: "OpenAI o1-mini",
    provider: "OpenAI",
    type: "reasoning",
    description:
      "Lightweight reasoning model optimized for rapid math and code analysis.",
    supportsReasoning: true,
    supportsTools: true,
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1 (Reasoner)",
    provider: "DeepSeek",
    type: "reasoning",
    description:
      "DeepSeek R1 reasoning architecture with chain-of-thought execution.",
    supportsReasoning: true,
    supportsTools: true,
  },

  // --- Multimodal & Standard Flagship Models ---
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    type: "multimodal",
    description:
      "Omni flagship model for high-intelligence text, vision, and tool execution tasks.",
    supportsReasoning: false,
    supportsTools: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "OpenAI",
    type: "fast",
    description:
      "Cost-efficient and fast model ideal for lightweight assistant queries.",
    supportsReasoning: false,
    supportsTools: true,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    type: "multimodal",
    description:
      "Anthropic industry-standard model for high-fidelity code and structured writing.",
    supportsReasoning: false,
    supportsTools: true,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    type: "fast",
    description: "Ultra-fast intelligence for low-latency workflow automation.",
    supportsReasoning: false,
    supportsTools: true,
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3 (Chat)",
    provider: "DeepSeek",
    type: "standard",
    description: "DeepSeek V3 flagship general conversation and code model.",
    supportsReasoning: false,
    supportsTools: true,
  },
];

/**
 * Model IDs explicitly recognized as supporting reasoning / thinking blocks.
 */
export const THINKING_MODEL_IDS = AVAILABLE_MODELS.filter(
  (m) => m.supportsReasoning,
).map((m) => m.id);

/**
 * Helper to retrieve metadata for a given model ID.
 */
export function getModelDetails(modelId: string): ModelOption | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

/**
 * Determines whether a model ID is a reasoning/thinking model.
 */
export function isThinkingModel(modelId: string): boolean {
  if (!modelId) return false;
  const lower = modelId.toLowerCase();
  return (
    THINKING_MODEL_IDS.includes(modelId) ||
    lower.includes("o1") ||
    lower.includes("o3") ||
    lower.includes("reasoner") ||
    lower.includes("thinking") ||
    lower.includes("r1")
  );
}
