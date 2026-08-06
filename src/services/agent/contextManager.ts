/**
 * @file contextManager.ts
 * @description Context pruning and payload formatting functions for AI agent execution loops.
 */

/**
 * Repairs a partially streamed JSON string by closing unclosed quotes,
 * brackets, and braces so JSON.parse can extract partial objects in real-time.
 *
 * @param jsonStr Raw partially streamed JSON string from LLM chunks.
 * @returns Repaired valid JSON string ready for parsing.
 */
export function repairPartialJSON(jsonStr: string): string {
  if (!jsonStr || typeof jsonStr !== "string") return "{}";
  let str = jsonStr.trim();
  if (!str) return "{}";

  // Ensure starting brace exists
  const firstBrace = str.indexOf("{");
  if (firstBrace === -1) return "{}";
  str = str.substring(firstBrace);

  let inString = false;
  let isEscaped = false;
  let result = "";
  const stack: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        result += char;
      } else if (char === "\\") {
        isEscaped = true;
        result += char;
      } else if (char === '"') {
        inString = false;
        result += char;
      } else if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "\t") {
        result += "\\t";
      } else {
        result += char;
      }
    } else {
      if (char === '"') {
        inString = true;
        result += char;
      } else if (char === "{") {
        stack.push("}");
        result += char;
      } else if (char === "[") {
        stack.push("]");
        result += char;
      } else if (char === "}" || char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
        result += char;
      } else {
        result += char;
      }
    }
  }

  // Handle unclosed string literals
  if (inString) {
    if (isEscaped) {
      result = result.slice(0, -1);
    }
    result += '"';
  }

  // Remove trailing whitespace
  result = result.trimEnd();

  // Remove trailing comma outside string
  if (result.endsWith(",")) {
    result = result.slice(0, -1).trimEnd();
  }

  // Append null for trailing colon without value e.g. "key":
  if (result.endsWith(":")) {
    result += " null";
  }

  // Handle key without colon e.g. {"key"
  if (/[,{]\s*"[^"]*"$/.test(result)) {
    result += ": null";
  }

  // Close remaining brackets/braces in reverse order
  while (stack.length > 0) {
    result += stack.pop();
  }

  return result;
}

/**
 * Extracts a partial or fully streamed string value for a specific key in JSON.
 * Correctly unescapes quotes, backslashes, tabs, and newlines on the fly.
 */
export function extractPartialString(
  jsonStr: string,
  key: string,
): string | undefined {
  const keyIndex = jsonStr.indexOf(`"${key}"`);
  if (keyIndex === -1) return undefined;

  const afterKey = jsonStr.substring(keyIndex + `"${key}"`.length);
  const colonIndex = afterKey.indexOf(":");
  if (colonIndex === -1) return undefined;

  const afterColon = afterKey.substring(colonIndex + 1);
  const firstQuote = afterColon.indexOf('"');
  if (firstQuote === -1) return undefined;

  const startIdx = firstQuote + 1;
  const rawValue = afterColon.substring(startIdx);

  let val = "";
  let escaped = false;
  for (let i = 0; i < rawValue.length; i++) {
    const char = rawValue[i];
    if (escaped) {
      if (char === "n") val += "\n";
      else if (char === "t") val += "\t";
      else if (char === "r") val += "\r";
      else if (char === '"') val += '"';
      else if (char === "\\") val += "\\";
      else val += "\\" + char;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === '"') {
      break;
    } else {
      val += char;
    }
  }
  return val;
}

/**
 * Parses a partially streamed JSON string to extract all fields in real-time.
 * Uses full JSON.parse first, then partial repair, and finally fallback regex extraction.
 *
 * @param str The partially streamed JSON string.
 * @returns Parsed object containing streamed parameter values.
 */
export function parsePartialJSON(str: string): Record<string, any> {
  if (!str) return {};

  // 1. Try standard JSON parse
  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // Fall through to repair
  }

  // 2. Try repairing partial JSON string
  try {
    const repaired = repairPartialJSON(str);
    const parsed = JSON.parse(repaired);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    // Fall through to fallback
  }

  // 3. Fallback string extraction for key fields
  const res: Record<string, any> = {};
  const keysToExtract = [
    "TargetFile",
    "targetFile",
    "path",
    "filePath",
    "target_file",
    "filename",
    "SourcePath",
    "DestinationPath",
    "content",
    "code",
    "script",
    "replacementContent",
    "ReplacementContent",
    "command",
    "query",
    "message",
    "agentId",
    "name",
    "instructions",
    "description",
    "startLine",
    "endLine",
    "keyword",
    "url",
    "target",
    "text",
    "body",
  ];

  for (const key of keysToExtract) {
    const val = extractPartialString(str, key);
    if (val !== undefined) {
      res[key] = val;
    }
  }

  return res;
}
