# Custom Tools & Workspace Architecture Guide

This guide provides full developer and agent reference documentation for the workspace structure and custom Python tools creation engine.

---

## 1. Workspace Directory & Governance Structure

The workspace consists of two primary regions:

### A. User Space (`/` or `/workspace/`)
Contains user files, source code, data files, markdown notes, and Python scripts created or edited by the user or agents.

### B. System Governance Space (`/.agents/`)
Contains agent definitions, permission rules, long-term memory logs, and custom tools.
- `/.agents/<agent-id>/agent.json`: Agent metadata definition (ID, name, description, avatar, prompt configuration).
- `/.agents/<agent-id>/permissions.json`: Security boundaries (tool permissions, path read/write access rules).
- `/.agents/<agent-id>/memories.txt`: Persistent memory entries stored by the agent.
- `/.agents/<agent-id>/tools/<tool_name>/`: Per-agent custom executable Python tool directories.

---

## 2. Creating Custom Tools

Custom tools allow agents to extend their operational capabilities using Python scripts that run automatically with zero friction.

### Directory Convention
A custom tool belongs to a specific agent (e.g. `admin` or `code-architect`) and resides in:
`/.agents/<agent-id>/tools/<tool_name>/`

It consists of two required files:
1. `tool.json`
2. `script.py`

---

### Step 1: Define `tool.json`

The `tool.json` file specifies the tool name, description, target function name, and parameter schema using standard JSON Schema formatting:

```json
{
  "name": "calculate_statistics",
  "description": "Calculates descriptive statistics (mean, median, std) for a list of numbers.",
  "function": "calculate_stats",
  "parameters": {
    "type": "object",
    "properties": {
      "numbers": {
        "type": "array",
        "items": { "type": "number" },
        "description": "Array of numeric values to analyze"
      },
      "title": {
        "type": "string",
        "description": "Optional title for the output report"
      }
    },
    "required": ["numbers"]
  }
}
```

#### JSON Schema Fields:
- `name` (string, required): The tool identifier.
- `description` (string, required): Clear explanation of what the tool does and when the agent should call it.
- `function` (string, optional): The exact name of the Python function to execute in `script.py`. If omitted, defaults to `name` or `main` or `run`.
- `parameters` (object, required): Standard JSON Schema describing input arguments.

---

### Step 2: Implement `script.py`

The `script.py` file contains the Python implementation. The target function must accept keyword arguments corresponding to the parameters defined in `tool.json`:

```python
# /.agents/admin/tools/calculate_statistics/script.py
from workspace import llm, fs, agent, tools

def calculate_stats(numbers: list, title: str = "Analysis", **kwargs):
    """
    Function signature matches the 'function' parameter in tool.json.
    Keyword arguments are automatically extracted from the agent's tool call parameters.
    """
    if not numbers:
        return {"error": "No numbers provided"}
        
    avg = sum(numbers) / len(numbers)
    min_val = min(numbers)
    max_val = max(numbers)
    
    result = {
        "title": title,
        "count": len(numbers),
        "mean": avg,
        "min": min_val,
        "max": max_val
    }
    
    return result
```

---

## 3. Pre-Installed Workspace Python SDK (`from workspace import ...`)

The Python runtime pre-installs the `workspace` module for seamless interaction with the environment:

- **`workspace.llm`**:
  - `llm.generate(prompt: str, system: str = None) -> str`: Generate LLM text completion.
  - `llm.chat(messages: list[dict]) -> str`: Multi-turn chat completion.
  - `llm.structured(prompt: str, schema: dict) -> dict`: Parse structured JSON responses matching schema.

- **`workspace.fs`**:
  - `fs.read(path: str) -> str`: Read text file content.
  - `fs.write(path: str, content: str) -> None`: Write text to virtual file.
  - `fs.list(path: str = ".") -> list[str]`: List directory contents safely.
  - `fs.exists(path: str) -> bool`: Check if path exists.
  - `fs.delete(path: str) -> None`: Remove file or directory.

- **`workspace.agent`**:
  - `agent.get_id() -> str`: Get current executing agent ID.
  - `agent.save_memory(text: str) -> None`: Save persistent memory entry.

- **`workspace.tools`**:
  - `tools.search_wikipedia(query: str) -> str`: Search Wikipedia.
  - `tools.call_agent(agent_id: str, prompt: str) -> str`: Delegate sub-task to another agent.

---

## 4. Execution Flow & Auto-Discovery

1. The platform automatically scans `/.agents/[agent-id]/tools/*/tool.json` upon initialization and file changes.
2. When an agent calls a custom tool, the system loads `script.py`, wraps it with an auto-invocation handler, and executes it in the Python sandbox.
3. The return value or printed stdout is returned to the agent as the tool response.
