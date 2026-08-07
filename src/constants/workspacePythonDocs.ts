/**
 * @file workspacePythonDocs.ts
 * @description Concise reference documentation for the zero-dependency 'workspace' Python API.
 * Injected into agent system prompts using the ${"${workspace-python-docs}"} macro token.
 */

/**
 * Standard Python API reference injected into the system prompt.
 * Teaches agents how to use the 'workspace' mock module in Pyodide.
 */
export const WORKSPACE_PYTHON_DOCS = `### WORKSPACE PYTHON API REFERENCE ('from workspace import llm, fs, agent, tools')

Zero-dependency Python library pre-installed for 'run_python' and tool scripts:
1. LLM Engine ('workspace.llm'):
   • llm.generate(prompt: str, system: str = None) -> str
   • llm.chat(messages: list[dict]) -> str  # [{"role": "user"|"assistant"|"system", "content": "..."}]
   • llm.structured(prompt: str, schema: dict) -> dict  # Returns parsed JSON matching schema
2. Filesystem ('workspace.fs') [Permission-Checked]:
   • fs.read(path: str) -> str | fs.write(path: str, content: str)
   • fs.append(path: str, content: str) | fs.list(path: str = '.') -> list[str]
   • fs.exists(path: str) -> bool | fs.delete(path: str)
3. Agent Context ('workspace.agent'):
   • agent.get_id() -> str | agent.save_memory(text: str) | agent.read_memories() -> str
4. Tool Execution ('workspace.tools') [Permission-Checked]:
   • tools.execute_tool(tool_name: str, params: dict = None) -> dict  # Invokes authorized agent tools (e.g., 'search_wikipedia', 'read_file', 'write_file', 'list_dir', 'delete_file')`;
