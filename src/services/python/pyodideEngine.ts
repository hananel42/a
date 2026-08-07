/**
 * @file pyodideEngine.ts
 * @module services/python
 * @description Core in-browser Pyodide WebAssembly runner engine for local Python execution.
 * Handles lazy Pyodide loading, virtual filesystem sync, interactive STDIN, real-time log streaming,
 * dynamic package auto-loading, and workspace file modification tracking.
 */

import { WORKSPACE_PYTHON_FILES } from "../pythonWorkspaceLib";
import { DetailedPythonResult, WorkspacePythonStreamParams, PythonExecutionOptions } from "./types";
import { sanitizeStderr, isPyodideInternalStderrLine, extractInputPrompt } from "./utils";
import { WorkspaceItem } from "../../types/workspace";
import { getVirtualPath, findItemByPath } from "../../tools/types";

const PRIMARY_CDN = {
  js: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js",
  indexUrl: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
};

const FALLBACK_CDNS = [
  {
    js: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js",
    indexUrl: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
  },
  {
    js: "https://unpkg.com/pyodide@0.25.1/full/pyodide.js",
    indexUrl: "https://unpkg.com/pyodide@0.25.1/full/",
  },
];

let pyodideInstancePromise: Promise<any> | null = null;

/**
 * Loads a script from a given URL with a timeout.
 */
function loadScript(src: string, timeoutMs = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`[PyodideEngine] Loading runtime script: ${src}`);

    // Check if script already exists
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing && typeof (window as any).loadPyodide === "function") {
      console.log("[PyodideEngine] Pyodide script is already present in window context.");
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";

    const timer = setTimeout(() => {
      script.onerror = null;
      script.onload = null;
      console.error(`[PyodideEngine] Timeout (${timeoutMs}ms) loading script from: ${src}`);
      reject(new Error(`Timeout loading Pyodide runtime script from ${src}`));
    }, timeoutMs);

    script.onload = () => {
      clearTimeout(timer);
      console.log(`[PyodideEngine] Script loaded successfully: ${src}`);
      resolve();
    };

    script.onerror = (err) => {
      clearTimeout(timer);
      console.error(`[PyodideEngine] Error loading script from ${src}:`, err);
      reject(new Error(`Failed to load script tag from ${src}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Cleans up injected Pyodide script tags and window references if an initialization fails.
 */
function cleanupPyodideState(cdnJsUrl?: string) {
  if (typeof document === "undefined") return;

  if (cdnJsUrl) {
    const selector = `script[src="${cdnJsUrl}"]`;
    document.querySelectorAll(selector).forEach((el) => el.remove());
  }

  try {
    delete (window as any).loadPyodide;
    delete (window as any).pyodide;
  } catch {
    (window as any).loadPyodide = undefined;
    (window as any).pyodide = undefined;
  }
}

/**
 * Dynamically loads the Pyodide WebAssembly engine from CDN and returns the pyodide instance.
 * Tries primary and fallback CDNs cleanly, removing corrupted script tags if an attempt fails.
 */
export async function getPyodideInstance(): Promise<any> {
  if (pyodideInstancePromise) {
    return pyodideInstancePromise;
  }

  pyodideInstancePromise = (async () => {
    if (typeof window === "undefined") {
      const err = new Error("Pyodide execution is only supported in browser environments.");
      console.error("[PyodideEngine]", err.message);
      throw err;
    }

    const cdnsToTry = [PRIMARY_CDN, ...FALLBACK_CDNS];
    let lastError: any = null;

    for (const cdn of cdnsToTry) {
      try {
        console.log(`[PyodideEngine] Trying to load Pyodide from CDN: ${cdn.js}`);

        // Ensure clean state before attempting load
        cleanupPyodideState(cdn.js);

        await loadScript(cdn.js, 15000);

        const loadPyodideFn = (window as any).loadPyodide;
        if (typeof loadPyodideFn !== "function") {
          throw new Error("loadPyodide function was not found on window object after script load.");
        }

        console.log(`[PyodideEngine] Bootstrapping WebAssembly runtime with indexURL: ${cdn.indexUrl}`);
        const pyodide = await loadPyodideFn({
          indexURL: cdn.indexUrl,
        });

        console.log(`[PyodideEngine] Pyodide WebAssembly engine loaded successfully from ${cdn.js}`);
        return pyodide;
      } catch (err: any) {
        lastError = err;
        console.warn(`[PyodideEngine] CDN attempt failed (${cdn.js}):`, err?.message || err);
        cleanupPyodideState(cdn.js);
      }
    }

    pyodideInstancePromise = null; // reset singleton so user can retry
    const fatalMsg = `Pyodide WebAssembly initialization failed on all CDNs: ${lastError?.message || lastError}`;
    console.error(`[PyodideEngine] ${fatalMsg}`);
    throw new Error(fatalMsg);
  })();

  return pyodideInstancePromise;
}

/** Pre-warms the Pyodide runtime in the background for fast first execution */
export function prewarmPyodide(): void {
  if (typeof window !== "undefined") {
    console.log("[PyodideEngine] Pre-warming Pyodide runtime in background...");
    getPyodideInstance().catch((err) => {
      console.warn("[PyodideEngine] Background pre-warm failed (will retry on run):", err?.message);
    });
  }
}

/** Helper to ensure directory structure exists in Pyodide FS */
function ensureDirInFS(FS: any, dirPath: string) {
  const parts = dirPath.split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current += "/" + part;
    try {
      FS.mkdir(current);
    } catch {
      // Directory already exists
    }
  }
}

/** Populate Pyodide Virtual File System with workspace items and workspace Python libraries */
function populatePyodideFS(pyodide: any, items: WorkspaceItem[]) {
  const FS = pyodide.FS;

  const writeVirtualFile = (filePath: string, content: string, rootDir: string = "/") => {
    const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    const lastSlash = cleanPath.lastIndexOf("/");
    if (lastSlash > 0) {
      ensureDirInFS(FS, rootDir.slice(1) + cleanPath.slice(0, lastSlash));
    }
    try {
      FS.writeFile(rootDir + cleanPath, content, { encoding: "utf8" });
    } catch (e) {
      console.warn("Failed to write virtual file to Pyodide FS:", cleanPath, e);
    }
  };

  // 0. Ensure root dirs
  ensureDirInFS(FS, "sys_workspace");
  ensureDirInFS(FS, "workspace");

  // 1. Inject bundled workspace python libraries
  for (const [relPath, content] of Object.entries(WORKSPACE_PYTHON_FILES)) {
    writeVirtualFile(relPath, content, "/sys_workspace/");
  }

  // 2. Inject user workspace items
  for (const item of items) {
    if (item.type === "file") {
      const vPath = getVirtualPath(item.id, items);
      if (vPath) {
        writeVirtualFile(vPath, item.content || "", "/workspace/");
      }
    }
  }
}

/** Take snapshot of Pyodide virtual filesystem files to detect newly created or modified files */
function snapshotPyodideFS(pyodide: any): Map<string, string> {
  const FS = pyodide.FS;
  const snapshot = new Map<string, string>();

  function traverse(dir: string) {
    let entries: string[] = [];
    try {
      entries = FS.readdir(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry === "." || entry === "..") continue;
      const fullPath = dir === "/" ? "/" + entry : dir + "/" + entry;

      try {
        const stat = FS.stat(fullPath);
        if (FS.isDir(stat.mode)) {
          traverse(fullPath);
        } else if (FS.isFile(stat.mode)) {
          const prefix = "/workspace/";
          if (fullPath.startsWith(prefix)) {
            const relPath = fullPath.slice(prefix.length);
            const content = FS.readFile(fullPath, { encoding: "utf8" });
            snapshot.set(relPath, content);
          }
        }
      } catch {
        // ignore unreadable files
      }
    }
  }

  traverse("/workspace");
  return snapshot;
}

/** Core runner for Pyodide Python execution */
export async function runPyodideCode(params: {
  code: string;
  files?: WorkspaceItem[];
  inputs?: string[];
  agentId?: string;
  permissions?: any;
  filePath?: string;
  onChunk?: (chunk: { type: "stdout" | "stderr"; text: string }) => void;
}): Promise<{
  stdout: string;
  stderr: string;
  durationMs: number;
  modifiedFiles: Array<{ path: string; content: string }>;
  requiresInput: boolean;
  success: boolean;
  error?: string;
  extractedPrompt?: string;
}> {
  const startMs = performance.now();
  let stdoutAccumulator = "";
  let stderrAccumulator = "";

  try {
    const pyodide = await getPyodideInstance();

    console.log(`[PyodideEngine] Starting code execution (${params.code.length} chars, ${params.inputs?.length || 0} inputs)...`);

    // Set stdout & stderr stream callbacks
    pyodide.setStdout({
      batched: (text: string) => {
        console.log(`[Pyodide STDOUT] ${text}`);
        stdoutAccumulator += text + "\n";
        if (params.onChunk) {
          params.onChunk({ type: "stdout", text: text + "\n" });
        }
      },
    });

    pyodide.setStderr({
      batched: (text: string) => {
        const cleanText = sanitizeStderr(text);
        if (cleanText.length > 0) {
          console.warn(`[Pyodide STDERR] ${cleanText}`);
          stderrAccumulator += cleanText + "\n";
          if (params.onChunk) {
            params.onChunk({ type: "stderr", text: cleanText + "\n" });
          }
        }
      },
    });

    // Populate Virtual FS with workspace files
    const items = params.files || [];
    populatePyodideFS(pyodide, items);

    // Snapshot FS before execution
    const initialFS = snapshotPyodideFS(pyodide);

    // Auto load required packages if imports detected in code
    try {
      console.log("[PyodideEngine] Checking and loading imports from code...");
      await pyodide.loadPackagesFromImports(params.code);
    } catch (pkgErr) {
      console.warn("[PyodideEngine] Automatic package load warning:", pkgErr);
    }

    // Set up env vars and STDIN
    const inputsList = params.inputs || [];
    const agentId = params.agentId || "";
    const permissionsJson = JSON.stringify(params.permissions || null);

    const openaiKey = typeof window !== "undefined" ? localStorage.getItem("agent_hub_openai_key") || "" : "";
    const apiBaseUrl = typeof window !== "undefined" ? localStorage.getItem("agent_hub_api_base_url") || "" : "";
    const llmModel = typeof window !== "undefined" ? localStorage.getItem("agent_hub_model") || "" : "";
    const filePathVal = params.filePath || "";

    const pySetupCode = `
import sys
import os
import json
import builtins

# Handle working directory and module import path
file_path_val = ${JSON.stringify(filePathVal)}

# Mount sys_workspace for internal libraries

# Mount sys_workspace for internal libraries
if "/sys_workspace" not in sys.path:
    sys.path.insert(0, "/sys_workspace")

# Set working directory to /workspace so relative paths work nicely
if not os.path.exists("/workspace"):
    try:
        os.makedirs("/workspace")
    except Exception:
        pass

# Jailing logic to map '/' to '/workspace'
def _jail_path(p):
    if isinstance(p, str):
        if p == "/": return "/workspace"
        elif p.startswith("/") and not p.startswith(("/lib", "/dev", "/sys", "/tmp", "/proc", "/home", "/sys_workspace", "/workspace")):
            return "/workspace" + p
    return p

_orig_open = builtins.open
def _hooked_open(file, *args, **kwargs):
    return _orig_open(_jail_path(file), *args, **kwargs)
builtins.open = _hooked_open

import os
_orig_listdir = os.listdir
def _hooked_listdir(path="."):
    return _orig_listdir(_jail_path(path))
os.listdir = _hooked_listdir

_orig_abspath = os.path.abspath
def _hooked_abspath(path):
    res = _orig_abspath(path)
    if res.startswith("/workspace"):
        # map back to root for the user perspective if needed, but usually we just return the jailed path
        # wait, abspath is used internally, we probably shouldn't mess with it too much, or maybe we should strip /workspace
        pass
    return res

_orig_walk = os.walk
def _hooked_walk(top, topdown=True, onerror=None, followlinks=False):
    for root, dirs, files in _orig_walk(_jail_path(top), topdown, onerror, followlinks):
        if root.startswith("/workspace"):
            root = root[10:] if root != "/workspace" else "/"
        yield root, dirs, files
os.walk = _hooked_walk

if file_path_val:
    abs_path = os.path.abspath(os.path.join("/workspace", file_path_val))
    parent_dir = os.path.dirname(abs_path)
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    try:
        if os.path.isdir(parent_dir):
            os.chdir(parent_dir)
        else:
            os.chdir("/workspace")
    except Exception:
        os.chdir("/workspace")
else:
    if "/workspace" not in sys.path:
        sys.path.insert(0, "/workspace")
    try:
        os.chdir("/workspace")
    except Exception:
        pass


os.environ["AGENT_ID"] = ${JSON.stringify(agentId)}
os.environ["AGENT_PERMISSIONS"] = ${JSON.stringify(permissionsJson)}
os.environ["OPENAI_API_KEY"] = ${JSON.stringify(openaiKey)}
os.environ["OPENAI_BASE_URL"] = ${JSON.stringify(apiBaseUrl)}
os.environ["LLM_MODEL"] = ${JSON.stringify(llmModel)}

class ArrayStdin:
    def __init__(self, inputs_list):
        self.inputs = list(inputs_list)
        self.idx = 0
    def readline(self):
        if self.idx < len(self.inputs):
            val = self.inputs[self.idx]
            self.idx += 1
            return str(val) + "\\n"
        raise EOFError("EOF when reading a line")

sys.stdin = ArrayStdin(${JSON.stringify(inputsList)})

def _custom_input(prompt=""):
    if prompt:
        sys.stdout.write(str(prompt))
        sys.stdout.flush()
    if sys.stdin.idx >= len(sys.stdin.inputs):
        raise EOFError("__PROMPT__:" + str(prompt))
    val = sys.stdin.readline().rstrip("\\n")
    sys.stdout.write(val + "\\n")
    sys.stdout.flush()
    return val

builtins.input = _custom_input
`;

    await pyodide.runPythonAsync(pySetupCode);

    // Execute user code
    let success = true;
    let requiresInput = false;
    let errorMessage: string | undefined = undefined;
    let extractedPrompt = "";

    try {
      console.log("[PyodideEngine] Running Python script async...");
      await pyodide.runPythonAsync(params.code);
      console.log("[PyodideEngine] Python script execution finished successfully.");
    } catch (err: any) {
      success = false;
      const rawErrStr = String(err && err.message ? err.message : err);
      
      if (rawErrStr.includes("EOFError: __PROMPT__:") || rawErrStr.includes("EOFError: EOF when reading a line")) {
        requiresInput = true;
        const promptMatch = rawErrStr.match(/EOFError: __PROMPT__:(.*)/);
        if (promptMatch && promptMatch[1]) {
          extractedPrompt = promptMatch[1];
        }
        console.log("[PyodideEngine] Execution paused awaiting user STDIN input.");
      } else {
        const cleanErrStr = sanitizeStderr(rawErrStr) || rawErrStr;
        errorMessage = cleanErrStr;
        if (!stderrAccumulator.includes(cleanErrStr)) {
          stderrAccumulator += (stderrAccumulator ? "\n" : "") + cleanErrStr;
          if (params.onChunk) {
            params.onChunk({ type: "stderr", text: cleanErrStr });
          }
        }
      }
    }

    // Snapshot FS after execution and find created/modified files
    const finalFS = snapshotPyodideFS(pyodide);
    const modifiedFiles: Array<{ path: string; content: string }> = [];

    for (const [path, content] of finalFS.entries()) {
      if (!initialFS.has(path) || initialFS.get(path) !== content) {
        modifiedFiles.push({ path, content });
      }
    }

    const durationMs = Math.round(performance.now() - startMs);
    console.log(`[PyodideEngine] Execution complete in ${durationMs}ms. Success: ${success}. Modified files: ${modifiedFiles.length}`);

    return {
      stdout: stdoutAccumulator,
      stderr: sanitizeStderr(stderrAccumulator),
      durationMs,
      modifiedFiles,
      requiresInput,
      success,
      error: errorMessage,
      extractedPrompt,
    };
  } catch (globalErr: any) {
    const durationMs = Math.round(performance.now() - startMs);
    const cleanErr = sanitizeStderr(globalErr?.message || String(globalErr));
    return {
      stdout: stdoutAccumulator,
      stderr: cleanErr,
      durationMs,
      modifiedFiles: [],
      requiresInput: false,
      success: false,
      error: cleanErr,
      extractedPrompt: "",
    };
  }
}
