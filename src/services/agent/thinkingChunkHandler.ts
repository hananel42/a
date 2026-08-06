/**
 * @file thinkingChunkHandler.ts
 * @description State handlers for reasoning chunks, text tokens, and delta tool call streaming events.
 */

import { MessagePart, ToolCallStep } from "../../types/agent";
import { ActiveThinkingTimer } from "./thinkingTimer";
import { parsePartialJSON } from "./contextManager";

export interface StreamState {
  parts: MessagePart[];
  steps: ToolCallStep[];
  fullAssistantResponseText: string;
  currentTurnThinkingPartId: string | null;
}

export function handleReasoningChunk(
  reasoningChunk: string,
  state: StreamState,
  thinkingTimer: ActiveThinkingTimer,
): { updatedState: StreamState; currentThinkingPartId: string } {
  thinkingTimer.start();
  const currentDuration = thinkingTimer.getDurationMs();
  let parts = [...state.parts];

  // Find the last thinking part in state.parts
  let lastThinkingIndex = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].type === "thinking") {
      lastThinkingIndex = i;
      break;
    }
  }

  // Check if there is any 'text' part containing content AFTER the last thinking part
  let hasTextAfterLastThinking = false;
  if (lastThinkingIndex !== -1) {
    for (let i = lastThinkingIndex + 1; i < parts.length; i++) {
      if (
        parts[i].type === "text" &&
        parts[i].content &&
        parts[i].content.trim()
      ) {
        hasTextAfterLastThinking = true;
        break;
      }
    }
  }

  let thinkingPart: MessagePart | undefined = undefined;

  // Re-use active thinking block if no text response intervened after it
  if (lastThinkingIndex !== -1 && !hasTextAfterLastThinking) {
    thinkingPart = parts[lastThinkingIndex];
  } else if (state.currentTurnThinkingPartId) {
    thinkingPart = parts.find(
      (p) => p.id === state.currentTurnThinkingPartId && p.type === "thinking",
    );
  }

  if (!thinkingPart) {
    thinkingPart = {
      id: `part-think-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: "thinking",
      content: reasoningChunk,
      thinkingTimeMs: currentDuration,
      startTimeMs: Date.now(),
      isStreamingReasoning: true,
      steps: [],
      parts: [
        {
          id: `part-think-txt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: "text",
          content: reasoningChunk,
        },
      ],
    };
    parts.push(thinkingPart);
  } else {
    const updatedContent = (thinkingPart.content || "") + reasoningChunk;
    const subParts = thinkingPart.parts ? [...thinkingPart.parts] : [];
    const lastSubPart = subParts[subParts.length - 1];

    if (lastSubPart && lastSubPart.type === "text") {
      subParts[subParts.length - 1] = {
        ...lastSubPart,
        content: (lastSubPart.content || "") + reasoningChunk,
      };
    } else {
      subParts.push({
        id: `part-think-txt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: "text",
        content: reasoningChunk,
      });
    }

    thinkingPart = {
      ...thinkingPart,
      content: updatedContent,
      thinkingTimeMs: currentDuration,
      isStreamingReasoning: true,
      parts: subParts,
    };

    const targetIdx = parts.findIndex((p) => p.id === thinkingPart!.id);
    if (targetIdx >= 0) {
      parts[targetIdx] = thinkingPart;
    } else {
      parts.push(thinkingPart);
    }
  }

  return {
    updatedState: {
      ...state,
      parts,
      currentTurnThinkingPartId: thinkingPart.id,
    },
    currentThinkingPartId: thinkingPart.id,
  };
}

export function handleTextChunk(
  chunk: string,
  state: StreamState,
  thinkingTimer: ActiveThinkingTimer,
  onTextChunk?: (text: string) => void,
): StreamState {
  thinkingTimer.pause();
  const finalDuration = thinkingTimer.getDurationMs();
  let parts = state.parts.map((p) =>
    p.type === "thinking"
      ? { ...p, isStreamingReasoning: false, thinkingTimeMs: finalDuration }
      : p,
  );

  const fullAssistantResponseText = state.fullAssistantResponseText + chunk;
  if (onTextChunk) onTextChunk(chunk);

  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.type === "text") {
    parts[parts.length - 1] = {
      ...lastPart,
      content: (lastPart.content || "") + chunk,
    };
  } else {
    parts.push({
      id: `part-txt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: "text",
      content: chunk,
    });
  }

  return {
    ...state,
    parts,
    fullAssistantResponseText,
    currentTurnThinkingPartId: null,
  };
}

export function handleToolCallDelta(
  deltaToolCalls: Array<{ id: string; name: string; arguments: string }>,
  state: StreamState,
  thinkingTimer: ActiveThinkingTimer,
): StreamState {
  thinkingTimer.start();
  const currentDuration = thinkingTimer.getDurationMs();
  let parts = [...state.parts];
  let steps = [...state.steps];

  let thinkingPart = state.currentTurnThinkingPartId
    ? parts.find(
        (p) =>
          p.id === state.currentTurnThinkingPartId && p.type === "thinking",
      )
    : undefined;

  // Take only the first tool call if multiple are passed
  const singleDelta = deltaToolCalls.slice(0, 1);

  for (const dtc of singleDelta) {
    let stepIndex = steps.findIndex((s) => s.id === dtc.id);
    if (stepIndex < 0 && steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      if (lastStep.status === "running" || lastStep.status === "queued") {
        stepIndex = steps.length - 1;
      }
    }

    const parsedArgs = parsePartialJSON(dtc.arguments);

    if (stepIndex < 0) {
      const newStep: ToolCallStep = {
        id: dtc.id,
        toolName: dtc.name,
        args: parsedArgs,
        status: "running",
      };
      steps.push(newStep);

      if (thinkingPart) {
        parts = parts.map((p) => {
          if (p.id === thinkingPart!.id && p.type === "thinking") {
            const existingSteps = p.steps || [];
            const existingParts = p.parts || [];
            const updatedSteps = existingSteps.some((s) => s.id === newStep.id)
              ? existingSteps
              : [...existingSteps, newStep];
            const updatedParts = existingParts.some(
              (sp) => sp.type === "tool" && sp.step?.id === newStep.id,
            )
              ? existingParts
              : [
                  ...existingParts,
                  {
                    id: `part-tool-${newStep.id}`,
                    type: "tool" as const,
                    step: newStep,
                  },
                ];
            return {
              ...p,
              thinkingTimeMs: currentDuration,
              isStreamingReasoning: true,
              steps: updatedSteps,
              parts: updatedParts,
            };
          }
          return p;
        });
      } else {
        parts.push({
          id: `part-tool-${newStep.id}`,
          type: "tool",
          step: newStep,
        });
      }
    } else {
      steps[stepIndex] = {
        ...steps[stepIndex],
        toolName: dtc.name || steps[stepIndex].toolName,
        args: parsedArgs,
      };

      parts = parts.map((p) => {
        if (p.type === "tool" && p.step?.id === dtc.id) {
          return { ...p, step: steps[stepIndex] };
        }
        if (p.type === "thinking" && p.steps) {
          const updatedSubSteps = p.steps.map((s) =>
            s.id === dtc.id ? steps[stepIndex] : s,
          );
          const updatedSubParts = p.parts
            ? p.parts.map((sp) =>
                sp.type === "tool" && sp.step?.id === dtc.id
                  ? { ...sp, step: steps[stepIndex] }
                  : sp,
              )
            : p.parts;
          return {
            ...p,
            thinkingTimeMs: currentDuration,
            isStreamingReasoning: true,
            steps: updatedSubSteps,
            parts: updatedSubParts,
          };
        }
        return p;
      });
    }
  }

  return {
    ...state,
    parts,
    steps,
  };
}
