/**
 * @file utils.ts
 * @module services/python
 * @description Helper functions for output formatting, error sanitization, and prompt extraction
 * for the Python execution service layer.
 */

/**
 * Determines if a given stderr output line is an internal runtime diagnostic artifact.
 *
 * @param line - Raw line from standard error stream.
 * @returns True if the line is internal system diagnostic noise; false otherwise.
 */
export function isPyodideInternalStderrLine(line: string): boolean {
  if (!line) return false;
  const lower = line.toLowerCase().trim();
  return (
    lower.includes("python initialization complete") ||
    lower.includes("pyodide loaded") ||
    lower.includes("wasm streaming compile") ||
    lower.includes("loaded package") ||
    lower.includes("loading package") ||
    lower.includes("pyodide.asm.js") ||
    lower.includes("python path configuration") ||
    lower.includes("pythonhome") ||
    lower.includes("pythonpath") ||
    lower.includes("program name =") ||
    lower.includes("isolated =") ||
    lower.includes("environment =") ||
    lower.includes("user site =") ||
    lower.includes("safe_path =") ||
    lower.includes("import site =") ||
    lower.includes("is in build tree =") ||
    lower.includes("stdlib dir =") ||
    lower.includes("sys._base_executable") ||
    lower.includes("sys.exec_prefix") ||
    lower.includes("sys.executable") ||
    lower.includes("sys.prefix") ||
    lower.includes("sys.base_exec_prefix") ||
    lower.includes("sys.base_prefix") ||
    lower.includes("sys.path = [")
  );
}

/**
 * Cleans standard error text by removing CPython startup path configuration blocks
 * and stripping internal WebAssembly diagnostic traces.
 *
 * @param stderr - Raw standard error output text.
 * @returns Cleaned and formatted standard error string.
 */
export function sanitizeStderr(stderr: string): string {
  if (!stderr) return "";

  let text = stderr;

  // Strip CPython "Python path configuration:" block if present
  const pathConfigIdx = text.indexOf("Python path configuration:");
  if (pathConfigIdx !== -1) {
    const sysPathIdx = text.indexOf("sys.path = [", pathConfigIdx);
    if (sysPathIdx !== -1) {
      const closeBracketIdx = text.indexOf("]", sysPathIdx);
      if (closeBracketIdx !== -1) {
        text = text.slice(0, pathConfigIdx) + text.slice(closeBracketIdx + 1);
      } else {
        text = text.slice(0, pathConfigIdx);
      }
    } else {
      text = text.slice(0, pathConfigIdx);
    }
  }

  const lines = text
    .split("\n")
    .filter((l) => !isPyodideInternalStderrLine(l));

  return lines.join("\n").trim();
}

/**
 * Extracts the last printed prompt string from stdout/stderr when code requests interactive input.
 *
 * @param stdout - Captured standard output text.
 * @param stderr - Captured standard error text.
 * @returns Formatted prompt message string.
 */
export function extractInputPrompt(stdout: string, _stderr: string): string {
  if (!stdout) return "Please enter input for Python script:";
  const lines = stdout.trim().split("\n").filter((l) => l.trim().length > 0);
  if (lines.length > 0) {
    const lastLine = lines[lines.length - 1];
    if (!lastLine.includes("Traceback") && !lastLine.includes("EOFError")) {
      return lastLine;
    }
  }
  return "Please enter input for Python script:";
}
