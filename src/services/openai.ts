import { AGENT_MESSAGES } from "../constants/agentMessages";
/**
 * @file openai.ts
 * @description Highly-customizable OpenAI Chat Completion service supporting real-time streaming,
 * abort controllers, custom system instructions, and advanced context management (context pruning/compression).
 *
 * Core Exports:
 * - getOpenAIClient(apiKey: string): Retrieves an instance of the OpenAI client.
 * - streamOpenAIChat(params): High-performance stream generator supporting tool-calling and abort signals.
 * - pruneChatContext(messages, maxMsgs): Extreme context manager that maintains system prompt integrity while pruning older messages.
 */

import OpenAI from "openai";

let clientInstance: OpenAI | null = null;
let lastUsedKey: string | null = null;
let lastUsedBaseUrl: string | null = null;

/**
 * Returns a memoized instance of the OpenAI client.
 */
export function getOpenAIClient(apiKey: string, baseURL?: string): OpenAI {
  const finalKey = apiKey || "not-needed-for-local";
  const cleanBaseUrl = baseURL ? baseURL.trim() : undefined;

  if (
    !clientInstance ||
    lastUsedKey !== finalKey ||
    lastUsedBaseUrl !== cleanBaseUrl
  ) {
    clientInstance = new OpenAI({
      apiKey: finalKey,
      baseURL: cleanBaseUrl,
      dangerouslyAllowBrowser: true, // Safe in this sandboxed playground environment
    });
    lastUsedKey = finalKey;
    lastUsedBaseUrl = cleanBaseUrl || null;
  }
  return clientInstance;
}

export interface ChatMessageParam {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

interface StreamChatParams {
  apiKey: string;
  baseURL?: string;
  model: string;
  messages: ChatMessageParam[];
  tools?: any[];
  signal?: AbortSignal;
  onText: (text: string) => void;
  onReasoningChunk?: (reasoning: string) => void;
  onToolCallDelta?: (
    toolCalls: Array<{ id: string; name: string; arguments: string }>,
  ) => void;
}

/**
 * Strips pseudo tool XML tags from text so raw <tool_name>...</function> strings are not rendered in Markdown.
 */
export function cleanTextFromPseudoTools(text: string): string {
  if (!text) return text;
  return text
    .replace(
      /<([a-zA-Z0-9_-]+)>\s*\{[\s\S]*?\}\s*;?\s*<\/(?:function|\1)>/gi,
      "",
    )
    .replace(
      /<(?:tool_call|function_call)>\s*\{[\s\S]*?\}\s*<\/(?:tool_call|function_call)>/gi,
      "",
    )
    .trim();
}

/**
 * Safely extracts pseudo tool calls embedded as XML/text tags (e.g. <call_agent>{...};</function> or <tool_call>...)
 * from text or reasoning streams when models output text-based tool calls.
 */
export function extractPseudoToolCalls(text: string): {
  cleanedText: string;
  toolCalls: any[];
} {
  if (!text) return { cleanedText: text, toolCalls: [] };

  let cleanedText = text;
  const toolCalls: any[] = [];

  const tryParseJson = (str: string) => {
    const cleanStr = str.trim().replace(/;\s*$/, "");
    try {
      return JSON.parse(cleanStr);
    } catch {
      return null;
    }
  };

  // 1. Match <tool_name>{"arg": "val"};</function> or <tool_name>{"arg": "val"}</tool_name>
  const tagToolRegex =
    /<([a-zA-Z0-9_-]+)>\s*(\{[\s\S]*?\})\s*;?\s*<\/(?:function|\1)>/gi;
  let match;
  while ((match = tagToolRegex.exec(text)) !== null) {
    const rawName = match[1];
    const rawJson = match[2];
    const parsedObj = tryParseJson(rawJson);
    if (parsedObj) {
      let finalName = rawName;
      let finalArgs = parsedObj;

      if (
        parsedObj.name &&
        (parsedObj.arguments ||
          parsedObj.parameters ||
          parsedObj.input ||
          parsedObj.args)
      ) {
        finalName = parsedObj.name;
        finalArgs =
          parsedObj.arguments ||
          parsedObj.parameters ||
          parsedObj.input ||
          parsedObj.args;
      }

      toolCalls.push({
        id: `call-tag-${Math.random().toString(36).substring(2, 9)}`,
        type: "function" as const,
        isPseudo: true,
        function: {
          name: finalName,
          arguments:
            typeof finalArgs === "string"
              ? finalArgs
              : JSON.stringify(finalArgs),
        },
      });

      cleanedText = cleanedText.replace(match[0], "");
    }
  }

  // 2. Match <tool_call>...</tool_call> or <function_call>...</function_call>
  const genericCallRegex =
    /<(?:tool_call|function_call)>\s*(\{[\s\S]*?\})\s*<\/(?:tool_call|function_call)>/gi;
  while ((match = genericCallRegex.exec(text)) !== null) {
    const rawJson = match[1];
    const parsedObj = tryParseJson(rawJson);
    if (parsedObj && (parsedObj.name || parsedObj.tool || parsedObj.function)) {
      const toolName = parsedObj.name || parsedObj.tool || parsedObj.function;
      const rawArgs =
        parsedObj.arguments ||
        parsedObj.parameters ||
        parsedObj.input ||
        parsedObj.args ||
        {};
      toolCalls.push({
        id: `call-xml-${Math.random().toString(36).substring(2, 9)}`,
        type: "function" as const,
        isPseudo: true,
        function: {
          name: toolName,
          arguments:
            typeof rawArgs === "string" ? rawArgs : JSON.stringify(rawArgs),
        },
      });

      cleanedText = cleanedText.replace(match[0], "");
    }
  }

  return {
    cleanedText: cleanedText.trim(),
    toolCalls,
  };
}

/**
 * High-performance streaming Chat Completion wrapper with reasoning/thinking stream extraction
 * and tool call parsing.
 */
export async function streamOpenAIChat({
  apiKey,
  baseURL,
  model,
  messages,
  tools,
  signal,
  onText,
  onReasoningChunk,
  onToolCallDelta,
}: StreamChatParams): Promise<any> {
  const openai = getOpenAIClient(apiKey, baseURL);

  let formattedTools =
    tools && tools.length > 0
      ? tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }))
      : undefined;

  try {
    const tempStored = localStorage.getItem("agent_hub_temperature");
    const temperature = tempStored ? parseFloat(tempStored) : 0.7;

    let stream;
    try {
      stream = await openai.chat.completions.create(
        {
          model: model || "gpt-4o-mini",
          temperature: temperature,
          messages: messages as any,
          tools: formattedTools as any,
          tool_choice: formattedTools ? "auto" : undefined,
          stream: true,
        },
        { signal },
      );
    } catch (err: any) {
      // Only retry without tools if model explicitly rejects the 'tools' or 'tool_choice' parameter
      const msgLower = (err.message || "").toLowerCase();
      const isToolUnsupportedError =
        msgLower.includes("does not support tools") ||
        msgLower.includes("does not support function") ||
        msgLower.includes("unsupported parameter: tools") ||
        msgLower.includes("unsupported parameter: tool_choice");

      if (formattedTools && isToolUnsupportedError) {
        console.warn(
          "Tools/Functions not supported by model. Retrying without tools...",
          err,
        );
        stream = await openai.chat.completions.create(
          {
            model: model || "gpt-4o-mini",
            messages: messages as any,
            stream: true,
          },
          { signal },
        );
        formattedTools = undefined;
      } else {
        throw err;
      }
    }

    let fullText = "";
    let fullReasoning = "";
    let inThinkTag = false;
    let toolCallsBuffer: Record<
      number,
      { id?: string; name?: string; arguments: string }
    > = {};

    for await (const chunk of stream) {
      if (signal?.aborted) {
        break;
      }

      const delta = chunk.choices[0]?.delta as any;
      if (!delta) continue;

      // 1. Explicit Reasoning Stream (DeepSeek R1, OpenAI o1/o3, vLLM, OpenRouter)
      const deltaReasoning =
        delta.reasoning_content || delta.reasoning || delta.thought;
      if (deltaReasoning) {
        fullReasoning += deltaReasoning;
        if (onReasoningChunk) {
          onReasoningChunk(deltaReasoning);
        }
      }

      // 2. Text Content Streaming & <think> Tag Extraction
      if (delta.content) {
        const rawContent = delta.content;

        // Check for <think> or </think> tag boundaries in content stream
        if (rawContent.includes("<think>")) {
          inThinkTag = true;
          const parts = rawContent.split("<think>");
          if (parts[0]) {
            fullText += parts[0];
            onText(parts[0]);
          }
          if (parts[1]) {
            if (parts[1].includes("</think>")) {
              const subParts = parts[1].split("</think>");
              fullReasoning += subParts[0];
              if (onReasoningChunk) onReasoningChunk(subParts[0]);
              inThinkTag = false;
              if (subParts[1]) {
                fullText += subParts[1];
                onText(subParts[1]);
              }
            } else {
              fullReasoning += parts[1];
              if (onReasoningChunk) onReasoningChunk(parts[1]);
            }
          }
        } else if (inThinkTag) {
          if (rawContent.includes("</think>")) {
            const parts = rawContent.split("</think>");
            fullReasoning += parts[0];
            if (onReasoningChunk) onReasoningChunk(parts[0]);
            inThinkTag = false;
            if (parts[1]) {
              fullText += parts[1];
              onText(parts[1]);
            }
          } else {
            fullReasoning += rawContent;
            if (onReasoningChunk) onReasoningChunk(rawContent);
          }
        } else {
          fullText += rawContent;
          onText(rawContent);
        }
      }

      // 3. Tool Calls Streaming - strictly single tool call per turn
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const index = tc.index ?? 0;
          if (index > 0) continue; // Ignore any secondary tool call
          if (toolCallsBuffer[index] === undefined) {
            if (!tc.id) {
              throw new Error("Received tool call chunk without an ID from the model.");
            }
            toolCallsBuffer[index] = {
              id: tc.id,
              name: tc.function?.name || "",
              arguments: "",
            };
          }
          if (tc.function?.name) toolCallsBuffer[index].name = tc.function.name;
          if (tc.function?.arguments) {
            toolCallsBuffer[index].arguments += tc.function.arguments;
          }
        }
        if (
          onToolCallDelta &&
          toolCallsBuffer[0] &&
          (toolCallsBuffer[0].name || toolCallsBuffer[0].arguments)
        ) {
          onToolCallDelta([
            {
              id: toolCallsBuffer[0].id,
              name: toolCallsBuffer[0].name || "",
              arguments: toolCallsBuffer[0].arguments,
            },
          ]);
        }
      }
    }

    // Return final aggregated text, reasoning, and tool calls
    const toolCalls = Object.entries(toolCallsBuffer)
      .map(([_, t]) => ({
        id: t.id,
        type: "function" as const,
        function: {
          name: t.name || "",
          arguments: t.arguments,
        },
      }))
      .filter((t) => t.function.name !== "");

    // Post-process fullText & fullReasoning for embedded pseudo tool calls
    const textPseudo = extractPseudoToolCalls(fullText);
    fullText = textPseudo.cleanedText;

    const allToolCalls = [...toolCalls, ...textPseudo.toolCalls];

    if (fullReasoning) {
      const reasoningPseudo = extractPseudoToolCalls(fullReasoning);
      fullReasoning = reasoningPseudo.cleanedText;
      allToolCalls.push(...reasoningPseudo.toolCalls);
    }

    // STRICT INTENT: Limit to strictly ONE tool call per turn
    const singleToolCall = allToolCalls.slice(0, 1);

    return {
      text: fullText,
      reasoning: fullReasoning || undefined,
      toolCalls: singleToolCall.length > 0 ? singleToolCall : undefined,
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { text: "", aborted: true };
    }
    throw err;
  }
}

/**
 * Dynamic Context Pruner (Extreme context management)
 * Keeps the crucial system guidelines and the most recent N messages,
 * ensuring the LLM token budget is preserved without losing immediate memory.
 */
export function pruneChatContext(
  messages: ChatMessageParam[],
  maxMessages: number = 15,
): ChatMessageParam[] {
  const systemMsgs = messages.filter((m) => m.role === "system");
  const chatMsgs = messages.filter((m) => m.role !== "system");

  if (chatMsgs.length <= maxMessages) {
    return messages;
  }

  // Find a safe split point near maxMessages from the end.
  // A safe split point is a 'user' message, so that any preceding tool calls/responses are completely pruned,
  // and we don't orphan any tool_calls/responses.
  let splitIndex = chatMsgs.length - maxMessages;

  // Search forwards or backwards from the target splitIndex to find a 'user' message
  let foundSafe = false;
  for (let i = splitIndex; i < chatMsgs.length; i++) {
    if (chatMsgs[i].role === "user") {
      splitIndex = i;
      foundSafe = true;
      break;
    }
  }

  if (!foundSafe) {
    // If we didn't find a user message forward, search backward
    for (let i = splitIndex; i >= 0; i--) {
      if (chatMsgs[i].role === "user") {
        splitIndex = i;
        foundSafe = true;
        break;
      }
    }
  }

  let prunedChat = foundSafe
    ? chatMsgs.slice(splitIndex)
    : chatMsgs.slice(-maxMessages);

  // Ensure we don't start with a 'tool' message or an orphaned tool response
  while (
    prunedChat.length > 0 &&
    (prunedChat[0].role === "tool" ||
      (prunedChat[0].role === "assistant" && prunedChat[0].tool_calls))
  ) {
    prunedChat = prunedChat.slice(1);
  }

  // Inject an informative notice of truncation so the agent understands context loss
  const contextIndicator: ChatMessageParam = {
    role: "system",
    content:
      AGENT_MESSAGES.CONTEXT_PRUNED_WARNING,
  };

  return [...systemMsgs, contextIndicator, ...prunedChat];
}
