# Chatbot flow — Frontend → Ollama (Qwen 2.5) → Laravel MCP

Flow documentation for the Northloom planning assistant through to the Hospitable backend MCP tools.

## Overview

The user types in the Vue chat. The Laravel API authenticates the request, the agent (`HospitableChatAgent`) sends the message to **local Ollama (qwen2.5)**. The model decides whether it needs to call an MCP tool. If so, Laravel starts the local MCP server (`php artisan mcp:start hospitable`), runs the tool (create project, task, etc.), and returns the result to the model, which produces the final reply for the frontend.

```mermaid
flowchart TD
    A["User in Northloom<br/>/chat"] --> B["ChatPage.vue"]
    B --> C["Vuex chat/sendMessage"]
    C --> D["chat.service.js<br/>POST /api/chat"]
    D --> E{"Laravel API<br/>auth:api Passport"}
    E -->|401| Z1["Frontend: invalid session"]
    E -->|"200 auth OK"| F["ChatController@store"]
    F --> G["HospitableChatAgent<br/>laravel/ai"]
    G --> H["Load history<br/>agent_conversations"]
    G --> I["List MCP tools<br/>Client::local mcp:start hospitable"]
    G --> J["Local Ollama<br/>qwen2.5:latest<br/>OLLAMA_URL"]
    J --> K{"Does the model need<br/>to call a tool?"}
    K -->|No| L["Text reply"]
    K -->|Yes| M["tools/call JSON-RPC<br/>MCP stdio"]
    M --> N["HospitableServer<br/>Matching tool"]
    N --> O["AuthenticatesMcpUser<br/>USER_LOGIN / PASSWORD_USER"]
    O --> P["Domain Services<br/>Project / Task / Fund / Cost / Report"]
    P --> Q[("PostgreSQL")]
    Q --> P
    P --> N
    N --> M
    M --> J
    J --> L
    L --> R["JSON response<br/>conversation_id + message + tool_calls"]
    R --> C
    C --> B
    B --> S["Assistant bubble<br/>+ tools used"]
```

## Detailed sequence

```mermaid
sequenceDiagram
    actor U as User
    participant V as Vue /chat
    participant API as Laravel POST /api/chat
    participant Agent as HospitableChatAgent
    participant LLM as Ollama qwen2.5
    participant MCP as MCP hospitable stdio
    participant Dom as Domain + DB

    U->>V: Types a message
    V->>API: POST /api/chat with message and conversation_id
    Note over API: Bearer token / Passport cookie
    API->>Agent: forUser / continue + prompt
    Agent->>MCP: connect + tools/list
    MCP-->>Agent: store-project-tool, store-task-tool
    Agent->>LLM: instructions + history + tools + message
    LLM-->>Agent: text and/or tool_calls

    alt Model calls a tool
        Agent->>MCP: tools/call name + arguments
        MCP->>Dom: Tool handle with MCP user
        Dom-->>MCP: structured result
        MCP-->>Agent: tool result
        Agent->>LLM: tool result
        LLM-->>Agent: final text reply
    end

    Agent-->>API: AgentResponse
    API-->>V: conversation_id, message, tool_calls
    V-->>U: Shows reply in chat
```

## Layers and files

| Step | Where | Role |
|---|---|---|
| UI | `src/modules/chat/pages/ChatPage.vue` | Chat, suggestions, bubbles, history |
| State | `src/modules/chat/store/chat.store.js` | Messages, `conversationId`, sending, conversations |
| HTTP | `src/modules/chat/services/chat.service.js` | `POST /chat`, `GET /conversations` |
| API route | `routes/api.php` → `ChatController` / `ConversationController` | Auth + orchestrates agent / history |
| Agent | `app/Ai/Agents/HospitableChatAgent.php` | Ollama provider + MCP tools |
| LLM config | `config/ai.php` + `.env` (`OLLAMA_URL`, `AI_MODEL`) | Ollama only |
| MCP registry | `routes/ai.php` → `Mcp::local('hospitable', …)` | stdio server |
| Tools | `app/Mcp/Tools/*` | Projects, tasks, funds, costs, etc. |

## Key points

1. **MCP ≠ chat.** MCP only exposes tools. Natural language is handled by **Ollama (qwen2.5)**.
2. **Two-layer auth**
   - Frontend → API: logged-in user (Passport).
   - MCP tools → domain: service account `USER_LOGIN` / `PASSWORD_USER`.
3. **Ollama on Windows / API in WSL-Docker**  
   `OLLAMA_URL` must point at the Windows host (e.g. `http://172.19.192.1:11434`), not the container `localhost`.
4. **Conversations** live in `agent_conversations` / `agent_conversation_messages` (`laravel/ai`). History is listed via `GET /conversations` and resumed via `conversation_id`.

## End-to-end example

1. User: *“Create an ERP project with currency BRL starting today.”*
2. Vue → `POST /api/chat`.
3. Agent sends the prompt + tool schemas to Qwen 2.5.
4. Qwen picks `store-project-tool` with `name`, `currency`, `starts_on`, `expected_ends_on`.
5. MCP runs the tool and persists the project.
6. Qwen replies in text confirming the created `id`.
7. Vue shows the reply and, if any, the tool used in the bubble.
