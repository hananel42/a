# Agentic Workspace Console v3.0 Documentation

Welcome to the official documentation suite for **Agentic Workspace Console v3.0**, an interactive multi-agent workspace environment featuring local/remote LLM orchestration, sandboxed Python code execution, Model Context Protocol (MCP) tool integration, and full document workspace management.

---

## 📚 Documentation Structure

This documentation suite is split into three dedicated manuals to serve users, developers, and technical architects:

### 1. [📖 Application User Guide (`/docs/USER_GUIDE.md`)](./USER_GUIDE.md)

- **Target Audience**: End Users, Prompt Engineers, Workspace Operators.
- **Scope**: Complete non-technical guide covering every visual feature, control panel, tab, modal, editor, file management workflow, agent setup, theme, and setting from the user's perspective.
- **Key Topics**:
  - Global Header & Model/Endpoint Status Controls
  - Multi-Session Chat Console & Agent Delegation Traces
  - Thinking Traces & Interactive Tool Approval Cards
  - Real-time Document Workspace & Code/Markdown Editors
  - Creating, Customizing & Configuring Multi-Agent Workforces
  - Agent Path Permissions, Character Limits & Memory Management
  - Settings, Local LLM Integration (Ollama / LM Studio), and Themes

### 2. [⚙️ Technical Architecture Specification (`/docs/TECHNICAL_ARCHITECTURE.md`)](./TECHNICAL_ARCHITECTURE.md)

- **Target Audience**: Systems Engineers, Security Auditors, AI Architects.
- **Scope**: In-depth specification of the behind-the-scenes engineering mechanics, data flows, execution loops, and security boundaries without UI/UX details or raw code dumps.
- **Key Topics**:
  - Full-Stack Express + Vite Sandboxed Topology
  - Multi-Agent Orchestration & Sub-Agent Delegation Stack
  - Model Context Protocol (MCP) & Dynamic Tool Discovery Protocol
  - Sandboxed Python Execution VM & File Diff Sync Engine
  - Context Compiler Engine, System Prompt Synthesis & Token Pruning
  - Streaming Reasoning Extraction (`<think>` tags & `reasoning_content`)
  - State Storage, Browser Persistence & Local Physical Directory Mounts

### 3. [💻 Code Architecture & Module Reference (`/docs/CODE_DOCUMENTATION.md`)](./CODE_DOCUMENTATION.md)

- **Target Audience**: Software Engineers, Code Maintainers.
- **Scope**: Comprehensive file-by-file and directory-by-directory technical reference detailing the responsibility, exports, state hooks, and design patterns of every single file in the codebase.
- **Key Topics**:
  - Express Server & Sandbox APIs (`server.ts`)
  - Application Root & Tab Navigation Routing (`src/App.tsx`)
  - Multi-Agent Engine & OpenAI Stream Adapter (`src/services/`)
  - Tool Registries & MCP Modules (`src/tools/`)
  - Custom React State Hooks (`src/hooks/`)
  - UI Component Hierarchy (`src/components/`)
  - Custom Markdown & KaTeX Engine (`src/markdown-engine/`)
  - Type System (`src/types/`) & Utility Modules (`src/utils/`)

---

## 🚀 Quick Reference

| Attribute                 | Details                                                                                           |
| :------------------------ | :------------------------------------------------------------------------------------------------ |
| **Application Name**      | Agentic Workspace Console                                                                         |
| **Current Version**       | v3.0                                                                                              |
| **Frontend Framework**    | React 18 + Vite 6 + Tailwind CSS                                                                  |
| **Backend Framework**     | Node.js + Express + Child Process Sandbox                                                         |
| **Default Port**          | `3000` (Host: `0.0.0.0`)                                                                          |
| **Primary LLM Protocols** | OpenAI Chat Completions API / Any OpenAI-compatible `/v1` endpoint (OpenAI, DeepSeek, Ollama, LM Studio, etc.) |
