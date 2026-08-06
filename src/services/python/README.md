# Python Service (`src/services/python`)

This module provides the service layer API for Python code execution, output formatting, error handling, and workspace synchronization across the application.

## Architecture & Modular Structure

The Python service is split into clean, single-responsibility modules under `src/services/python`:

| File | Purpose |
| :--- | :--- |
| **`types.ts`** | Interface definitions, execution contracts (`PythonExecutionOptions`, `WorkspacePythonParams`, `DetailedPythonResult`, `WorkspacePythonStreamParams`). |
| **`utils.ts`** | Helper utilities for formatting stderr messages (`sanitizeStderr`), filtering diagnostic lines (`isPyodideInternalStderrLine`), and prompt extraction (`extractInputPrompt`). |
| **`runner.ts`** | Core service handlers (`runPythonSandbox`, `executeWorkspacePythonStream`, `executeWorkspacePython`) returning standard error contracts. |
| **`index.ts`** | Central barrel re-exporting public service methods and types. |

## Backward Compatibility Layer

- **`src/services/pythonRunner.ts`**: Re-exports all members from `src/services/python` so that tools (`runPython.ts`, `customTools.ts`) and editor components (`CodeFileEditor.tsx`) continue operating seamlessly without breaking changes.

## Usage Example

```typescript
import { executeWorkspacePythonStream } from "../services/python";

const result = await executeWorkspacePythonStream({
  code: "a = 1",
  onChunk: (chunk) => {
    console.log(`[${chunk.type}] ${chunk.text}`);
  },
});

console.log(result.error); // "Error: Python execution is disabled."
```
