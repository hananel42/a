/**
 * @file agentEngine.ts
 * @description Multi-Agent Execution Engine. Orchestrates the conversation loop,
 * streams reasoning and text tokens, processes tool call execution,
 * and maintains chronologically interleaved text and tool execution parts.
 */

import { Agent, Message, ToolCallStep, MessagePart } from "../types/agent";
import {
  streamOpenAIChat,
  ChatMessageParam,
  pruneChatContext,
  cleanTextFromPseudoTools,
} from "./openai";
import {
  executeTool,
  getAvailableTools,
  ToolContext,
  getVirtualPath,
} from "./mcp";
import { buildAgentSystemPrompt } from "../utils/promptBuilder";
import { AGENT_MESSAGES } from "../constants/agentMessages";
import { ActiveThinkingTimer } from "./agent/thinkingTimer";
import {
  StreamState,
  handleReasoningChunk,
  handleTextChunk,
  handleToolCallDelta,
} from "./agent/thinkingChunkHandler";

export interface RunAgentParams {
  agent: Agent;
  allAgents: Agent[];
  chatHistory: Message[];
  apiKey: string;
  baseURL?: string;
  model: string;
  workspaceItems: any[];
  toolContext: ToolContext & {
    requestConfirmation?: (
      toolName: string,
      args: any,
      stepId: string,
    ) => Promise<boolean>;
    requiresConfirmationTools?: string[];
  };
  signal: AbortSignal;
  onReasoningChunk?: (chunk: string) => void;
  onTextChunk?: (text: string) => void;
  onStepsChange?: (steps: ToolCallStep[]) => void;
  onMessageUpdate?: (
    content: string,
    parts: MessagePart[],
    steps: ToolCallStep[],
  ) => void;
}

export async function runAgentConversation({
  agent,
  allAgents,
  chatHistory,
  apiKey,
  baseURL,
  model,
  workspaceItems,
  toolContext,
  signal,
  onTextChunk,
  onStepsChange,
  onMessageUpdate,
}: RunAgentParams): Promise<string> {
  const memoryFiles: { name: string; content: string }[] = [];
  const agentIdLower = agent.id.toLowerCase();

  const matchingMemoryItems = workspaceItems.filter((i) => {
    if (i.type !== "file" || !i.content) return false;
    const itemPath = getVirtualPath(i.id, workspaceItems).toLowerCase();
    return (
      itemPath === `.agents/${agentIdLower}/memories.txt` ||
      itemPath === `.agents/${agentIdLower}/memory.txt` ||
      itemPath === `.agents/memories/${agentIdLower}.txt` ||
      itemPath === `${agentIdLower}_memories.txt`
    );
  });

  if (matchingMemoryItems.length > 0) {
    matchingMemoryItems.forEach((item) => {
      memoryFiles.push({ name: item.name, content: item.content || "" });
    });
  }

  const systemPrompt = buildAgentSystemPrompt({
    agent,
    allAgents,
    workspaceItems,
    memoryFiles,
  });

  const effectiveModel =
    agent.defaultModel && agent.defaultModel.trim()
      ? agent.defaultModel.trim()
      : model;

  const messagesPayload: ChatMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...chatHistory.map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
  ];

  let streamState: StreamState = {
    parts: [],
    steps: [],
    fullAssistantResponseText: "",
    currentTurnThinkingPartId: null,
  };

  const activeTools = getAvailableTools(
    workspaceItems,
    agent.permissions.allowedTools,
    agent.id,
  );

  const updateStepInState = (updatedStep: ToolCallStep) => {
    streamState.steps = streamState.steps.map((s) =>
      s.id === updatedStep.id ? updatedStep : s,
    );
    streamState.parts = streamState.parts.map((p) => {
      if (p.type === "tool" && p.step?.id === updatedStep.id) {
        return { ...p, step: updatedStep };
      }
      if (p.type === "thinking") {
        const updatedSubSteps = p.steps
          ? p.steps.map((s) => (s.id === updatedStep.id ? updatedStep : s))
          : undefined;
        const updatedSubParts = p.parts
          ? p.parts.map((sp) =>
              sp.type === "tool" && sp.step?.id === updatedStep.id
                ? { ...sp, step: updatedStep }
                : sp,
            )
          : p.parts;
        return { ...p, steps: updatedSubSteps, parts: updatedSubParts };
      }
      return p;
    });
  };

  const thinkingTimer = new ActiveThinkingTimer();

  try {
    let keepLooping = true;
    let loopCount = 0;
    const maxLoops = 8;

    while (keepLooping && loopCount < maxLoops) {
      if (signal.aborted) break;
      loopCount++;

      const prunedPayload = pruneChatContext(messagesPayload, 12);

      const result = await streamOpenAIChat({
        apiKey,
        baseURL,
        model: effectiveModel,
        messages: prunedPayload,
        tools: activeTools,
        signal,
        onReasoningChunk: (chunk) => {
          const res = handleReasoningChunk(chunk, streamState, thinkingTimer);
          streamState = res.updatedState;
          if (onMessageUpdate)
            onMessageUpdate(
              streamState.fullAssistantResponseText,
              [...streamState.parts],
              [...streamState.steps],
            );
        },
        onText: (chunk) => {
          streamState = handleTextChunk(
            chunk,
            streamState,
            thinkingTimer,
            onTextChunk,
          );
          if (onMessageUpdate)
            onMessageUpdate(
              streamState.fullAssistantResponseText,
              [...streamState.parts],
              [...streamState.steps],
            );
        },
        onToolCallDelta: (deltaToolCalls) => {
          streamState = handleToolCallDelta(
            deltaToolCalls,
            streamState,
            thinkingTimer,
          );
          if (onStepsChange) onStepsChange([...streamState.steps]);
          if (onMessageUpdate)
            onMessageUpdate(
              streamState.fullAssistantResponseText,
              [...streamState.parts],
              [...streamState.steps],
            );
        },
      });

      if (
        !result.toolCalls ||
        result.toolCalls.length === 0 ||
        signal.aborted
      ) {
        thinkingTimer.stop();
        streamState.parts = streamState.parts.map((p) =>
          p.type === "thinking" ? { ...p, isStreamingReasoning: false } : p,
        );
        if (onMessageUpdate)
          onMessageUpdate(
            streamState.fullAssistantResponseText,
            [...streamState.parts],
            [...streamState.steps],
          );
        keepLooping = false;
        break;
      }

      // Strictly limit to 1 tool call per turn
      const toolCallsToRun = result.toolCalls.slice(0, 1);

      messagesPayload.push({
        role: "assistant",
        content: result.content || null,
        tool_calls: toolCallsToRun,
      });

      for (const tc of toolCallsToRun) {
        if (signal.aborted) break;
        const stepId = tc.id;
        let step = streamState.steps.find((s) => s.id === stepId);

        let parsedArgs: any = {};
        try {
          parsedArgs =
            typeof tc.function.arguments === "string"
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments;
        } catch {
          parsedArgs = { raw: tc.function.arguments };
        }

        if (!step) {
          step = {
            id: stepId,
            toolName: tc.function.name,
            args: parsedArgs,
            status: "running",
          };
          streamState.steps.push(step);
          streamState.parts.push({
            id: `part-tool-${stepId}`,
            type: "tool",
            step,
          });
        } else {
          step.args = parsedArgs;
          step.toolName = tc.function.name;
          updateStepInState(step);
        }

        const isUserConfirmTool = toolContext.requiresConfirmationTools
          ? toolContext.requiresConfirmationTools.includes(tc.function.name)
          : false;

        const isDestructive =
          tc.function.name === "delete_file" ||
          tc.function.name === "run_python";
        const requiresConfirm = isUserConfirmTool || isDestructive;

        if (requiresConfirm && toolContext.requestConfirmation) {
          step.status = "pending_approval";
          updateStepInState(step);

          thinkingTimer.pause();
          const pausedTimeMs = thinkingTimer.getDurationMs();

          streamState.parts = streamState.parts.map((p) =>
            p.type === "thinking"
              ? { ...p, isPaused: true, thinkingTimeMs: pausedTimeMs }
              : p,
          );

          if (onStepsChange) onStepsChange([...streamState.steps]);
          if (onMessageUpdate)
            onMessageUpdate(
              streamState.fullAssistantResponseText,
              [...streamState.parts],
              [...streamState.steps],
            );

          const approved = await toolContext.requestConfirmation(
            tc.function.name,
            parsedArgs,
            stepId,
          );

          thinkingTimer.resume();
          streamState.parts = streamState.parts.map((p) =>
            p.type === "thinking" ? { ...p, isPaused: false } : p,
          );

          if (signal.aborted) {
            step.status = "cancelled";
            step.output = AGENT_MESSAGES.USER_CANCELLED;
            updateStepInState(step);
            break;
          }
          if (!approved) {
            step.status = "cancelled";
            step.output = AGENT_MESSAGES.USER_REJECTED;
            updateStepInState(step);
            if (onStepsChange) onStepsChange([...streamState.steps]);
            if (onMessageUpdate)
              onMessageUpdate(
                streamState.fullAssistantResponseText,
                [...streamState.parts],
                [...streamState.steps],
              );

            messagesPayload.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify({ error: AGENT_MESSAGES.USER_REJECTED }),
            });
            continue;
          }
        }

        if (signal.aborted) {
          step.status = "cancelled";
          updateStepInState(step);
          break;
        }

        step.status = "running";
        updateStepInState(step);
        if (onStepsChange) onStepsChange([...streamState.steps]);
        if (onMessageUpdate)
          onMessageUpdate(
            streamState.fullAssistantResponseText,
            [...streamState.parts],
            [...streamState.steps],
          );

        let toolResultStr = "";
        try {
          const toolContextForExecution = {
            ...toolContext,
            currentAgentId: agent.id,
            apiKey,
            baseURL,
            model: effectiveModel,
            onSubProgress: (
              subContent: string,
              subParts?: MessagePart[],
              subSteps?: ToolCallStep[],
            ) => {
              step.streamedText = subContent;
              if (subParts) step.subParts = subParts;
              if (subSteps) step.subSteps = subSteps;
              updateStepInState(step);
              if (onStepsChange) onStepsChange([...streamState.steps]);
              if (onMessageUpdate)
                onMessageUpdate(
                  streamState.fullAssistantResponseText,
                  [...streamState.parts],
                  [...streamState.steps],
                );
            },
          };

          toolResultStr = await executeTool(
            tc.function.name,
            parsedArgs,
            toolContextForExecution,
            agent.permissions,
          );
          step.status = "success";
          step.output = toolResultStr;
        } catch (err: any) {
          toolResultStr = `${AGENT_MESSAGES.TOOL_EXECUTION_FAILED_PREFIX}${err?.message || String(err)}`;
          step.status = "error";
          step.output = toolResultStr;
        }

        if (signal.aborted) {
          step.status = "cancelled";
          updateStepInState(step);
          break;
        }

        updateStepInState(step);
        if (onStepsChange) onStepsChange([...streamState.steps]);
        if (onMessageUpdate)
          onMessageUpdate(
            streamState.fullAssistantResponseText,
            [...streamState.parts],
            [...streamState.steps],
          );

        messagesPayload.push({
          role: "tool",
          tool_call_id: tc.id,
          content: toolResultStr,
        });
      }
      streamState.currentTurnThinkingPartId = null;
    }

    thinkingTimer.stop();
    streamState.parts = streamState.parts.map((p) =>
      p.type === "thinking" ? { ...p, isStreamingReasoning: false } : p,
    );
    if (onMessageUpdate)
      onMessageUpdate(
        streamState.fullAssistantResponseText,
        [...streamState.parts],
        [...streamState.steps],
      );

    const cleanedText = cleanTextFromPseudoTools(
      streamState.fullAssistantResponseText,
    );
    return cleanedText;
  } catch (err: any) {
    thinkingTimer.stop();
    streamState.parts = streamState.parts.map((p) =>
      p.type === "thinking" ? { ...p, isStreamingReasoning: false } : p,
    );
    streamState.steps = streamState.steps.map((s) =>
      s.status === "running" || s.status === "queued"
        ? { ...s, status: "cancelled" as const }
        : s,
    );
    if (onMessageUpdate)
      onMessageUpdate(
        streamState.fullAssistantResponseText,
        [...streamState.parts],
        [...streamState.steps],
      );

    if (signal.aborted || err.name === "AbortError") {
      return cleanTextFromPseudoTools(streamState.fullAssistantResponseText);
    }
    throw err;
  }
}
