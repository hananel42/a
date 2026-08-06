/**
 * @file customTools.ts
 * @description Dynamic discovery and execution runner for custom per-agent Python tools located in agent/[agentId]/tools/[toolName]/.
 * Each custom tool directory contains a tool.json definition and a script.py execution script.
 * Supports automatic function invocation where arguments passed to the tool are automatically routed to the defined target function.
 */

import { WorkspaceItem } from "../types/workspace";
import {
  getVirtualPath,
  findItemByPath,
  isPathAllowed,
  ToolContext,
} from "./types";
import { AgentPermissions } from "../types/agent";
import { runPythonSandbox } from "../services/pythonRunner";

export interface CustomToolDef {
  agentId: string;
  folderName: string;
  scriptPath: string;
  entrypoint: string;
  schema: {
    name: string;
    description: string;
    parameters: any;
    function?: string;
  };
  requiresUserApproval?: boolean;
}

/**
 * Scans workspace items for per-agent custom tool folders inside agent/[agentId]/tools/[toolName]/
 * e.g., agent/admin/tools/sample_tool/tool.json and script.py
 */
export function discoverCustomTools(
  items: WorkspaceItem[],
  targetAgentId?: string,
): CustomToolDef[] {
  const customTools: CustomToolDef[] = [];

  // Find all tool.json files inside workspace
  const jsonFiles = items.filter((item) => {
    if (item.type !== "file") return false;
    const virtualPath = getVirtualPath(item.id, items).toLowerCase();
    return virtualPath.endsWith("/tool.json");
  });

  for (const jsonItem of jsonFiles) {
    if (!jsonItem.content) continue;
    try {
      const parsed = JSON.parse(jsonItem.content);
      const virtualPath = getVirtualPath(jsonItem.id, items);
      const parts = virtualPath.split("/");

      // Pattern 1: .agents/[agentId]/tools/[toolName]/tool.json or agent/[agentId]/tools/[toolName]/tool.json (5+ parts)
      // Pattern 2: tools/[toolName]/tool.json (3+ parts - legacy fallback)
      let agentId = "global";
      let folderName = "";
      let scriptPath = "";

      const rootDir = parts[0].toLowerCase();
      if (
        parts.length >= 5 &&
        (rootDir === ".agents" || rootDir === "agent") &&
        parts[2].toLowerCase() === "tools"
      ) {
        agentId = parts[1];
        folderName = parts[3];
        scriptPath = `${parts[0]}/${agentId}/tools/${folderName}/script.py`;
      } else if (parts.length >= 3 && parts[0].toLowerCase() === "tools") {
        folderName = parts[parts.length - 2];
        scriptPath = `tools/${folderName}/script.py`;
      } else {
        continue;
      }

      // Filter by targetAgentId if provided
      if (targetAgentId && agentId !== "global") {
        if (agentId.toLowerCase() !== targetAgentId.toLowerCase()) {
          continue;
        }
      }

      const toolName =
        parsed.name && typeof parsed.name === "string" && parsed.name.trim()
          ? parsed.name.trim()
          : folderName;

      const entrypoint =
        parsed.function &&
        typeof parsed.function === "string" &&
        parsed.function.trim()
          ? parsed.function.trim()
          : parsed.entrypoint &&
              typeof parsed.entrypoint === "string" &&
              parsed.entrypoint.trim()
            ? parsed.entrypoint.trim()
            : toolName;

      customTools.push({
        agentId,
        folderName,
        scriptPath,
        entrypoint,
        schema: {
          name: toolName,
          description:
            parsed.description || `Custom Python tool located in ${scriptPath}`,
          parameters: parsed.parameters || { type: "object", properties: {} },
          function: entrypoint,
        },
        requiresUserApproval: !!parsed.requiresUserApproval,
      });
    } catch (err) {
      console.warn(
        `Failed to parse custom tool.json at item id ${jsonItem.id}:`,
        err,
      );
    }
  }

  return customTools;
}

/**
 * Executes a custom tool by running its script.py.
 * Automatically injects a function invocation wrapper so arguments passed to the tool are automatically
 * extracted and passed as keyword arguments to the specified Python function.
 * Uses low-level pythonRunner to bypass user-level path restrictions for the tool's own script and folder contents.
 */
export async function executeCustomTool(
  customTool: CustomToolDef,
  args: any,
  context: ToolContext,
  permissions?: AgentPermissions,
): Promise<string> {
  const stdinInput = JSON.stringify(args || {});
  const entrypoint = customTool.entrypoint || "main";
  const toolName = customTool.schema.name;

  // 1. Find script item in virtual workspace
  const scriptItem = findItemByPath(customTool.scriptPath, context.items);
  if (!scriptItem || scriptItem.type !== "file") {
    return `Error: Custom tool script file not found at "${customTool.scriptPath}".`;
  }

  const scriptCode = scriptItem.content || "";

  // 2. Build automatic Python invocation wrapper to route arguments directly to the target function
  const autoInvocationCode = `

# --- AUTOMATIC MCP CUSTOM TOOL FUNCTION RUNNER ---
import json as _mcp_json
import sys as _mcp_sys
import inspect as _mcp_inspect

_mcp_raw_args = ${JSON.stringify(stdinInput)}
_mcp_target_func_name = ${JSON.stringify(entrypoint)}
_mcp_tool_name = ${JSON.stringify(toolName)}

def _mcp_auto_execute():
    try:
        _mcp_kwargs = _mcp_json.loads(_mcp_raw_args) if _mcp_raw_args else {}
    except Exception:
        _mcp_kwargs = {}

    _mcp_func = None
    # 1. Look for explicit function name in tool.json, 2. Tool name, 3. 'main', 4. 'run'
    for _fname in [_mcp_target_func_name, _mcp_tool_name, 'main', 'run']:
        if _fname and _fname in globals() and callable(globals()[_fname]):
            _mcp_func = globals()[_fname]
            break

    if _mcp_func is not None:
        try:
            _sig = _mcp_inspect.signature(_mcp_func)
            _has_kwargs = any(p.kind == _mcp_inspect.Parameter.VAR_KEYWORD for p in _sig.parameters.values())
            if _has_kwargs:
                _call_args = _mcp_kwargs
            else:
                _valid_params = set(_sig.parameters.keys())
                _call_args = {k: v for k, v in _mcp_kwargs.items() if k in _valid_params}
            
            _result = _mcp_func(**_call_args)
            if _result is not None:
                if isinstance(_result, (dict, list)):
                    print(_mcp_json.dumps(_result, ensure_ascii=False, indent=2))
                else:
                    print(_result)
        except Exception as _e:
            print(f"Error executing function '{_mcp_func.__name__}': {_e}", file=_mcp_sys.stderr)

_mcp_auto_execute()
`;

  const fullExecutableCode = `${scriptCode}\n${autoInvocationCode}`;

  // 3. Gather allowed workspace files plus custom tool folder files
  const readPaths = permissions?.allowedReadPaths ||
    permissions?.allowedPaths || ["/"];
  const toolFolderPrefix = customTool.scriptPath
    .substring(0, customTool.scriptPath.lastIndexOf("/") + 1)
    .toLowerCase();

  const sandboxFiles = context.items.filter((item) => {
    if (item.type !== "file") return true;
    const itemPath = getVirtualPath(item.id, context.items).toLowerCase();

    // Always include files belonging to this custom tool folder
    if (toolFolderPrefix && itemPath.startsWith(toolFolderPrefix)) {
      return true;
    }

    // Include other workspace files allowed for the agent
    return isPathAllowed(
      itemPath,
      readPaths,
      context.currentAgentId,
      permissions,
    );
  });

  // 4. Execute via low-level pythonRunner engine with system tool access
  return await runPythonSandbox({
    code: fullExecutableCode,
    filePath: customTool.scriptPath,
    files: sandboxFiles,
    inputs: [stdinInput],
    context,
    permissions,
    isSystemTool: true,
  });
}
