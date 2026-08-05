# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
# Fluxo do Chatbot — Frontend → Ollama (Qwen 2.5) → MCP Laravel

Documento de fluxo do assistente de planejamento (Northloom) até as ferramentas MCP do backend .

## Visão geral

O usuário digita no chat do Vue. A API Laravel autentica a requisição, o agent (`HospitableChatAgent`) envia a mensagem ao **Ollama local (qwen2.5)**. O modelo decide se precisa chamar uma ferramenta MCP. Se sim, o Laravel inicia o servidor MCP local (`php artisan mcp:start hospitable`), executa a tool (criar projeto, tarefa, etc.) e devolve o resultado ao modelo, que gera a resposta final para o frontend.

```mermaid
flowchart TD
    A["Usuário no Northloom<br/>/chat"] --> B["ChatPage.vue"]
    B --> C["Vuex chat/sendMessage"]
    C --> D["chat.service.js<br/>POST /api/chat"]
    D --> E{"API Laravel<br/>auth:api Passport"}
    E -->|401| Z1["Frontend: sessão inválida"]
    E -->|"200 auth OK"| F["ChatController@store"]
    F --> G["HospitableChatAgent<br/>laravel/ai"]
    G --> H["Carrega histórico<br/>agent_conversations"]
    G --> I["Lista tools MCP<br/>Client::local mcp:start hospitable"]
    G --> J["Ollama local<br/>qwen2.5:latest<br/>OLLAMA_URL"]
    J --> K{"Modelo precisa<br/>chamar tool?"}
    K -->|Não| L["Resposta em texto"]
    K -->|Sim| M["tools/call JSON-RPC<br/>MCP stdio"]
    M --> N["HospitableServer<br/>Tool correspondente"]
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
    B --> S["Bolha Assistant<br/>+ tools usadas"]
```

## Sequência detalhada

```mermaid
sequenceDiagram
    actor U as Usuário
    participant V as Vue /chat
    participant API as Laravel POST /api/chat
    participant Agent as HospitableChatAgent
    participant LLM as Ollama qwen2.5
    participant MCP as MCP hospitable stdio
    participant Dom as Domain + DB

    U->>V: Digita mensagem
    V->>API: POST /api/chat com message e conversation_id
    Note over API: Bearer token / cookie Passport
    API->>Agent: forUser / continue + prompt
    Agent->>MCP: connect + tools/list
    MCP-->>Agent: store-project-tool, store-task-tool
    Agent->>LLM: instructions + histórico + tools + mensagem
    LLM-->>Agent: texto e/ou tool_calls

    alt Modelo chama tool
        Agent->>MCP: tools/call nome + arguments
        MCP->>Dom: Tool handle com usuário MCP
        Dom-->>MCP: resultado estruturado
        MCP-->>Agent: tool result
        Agent->>LLM: resultado da tool
        LLM-->>Agent: resposta final em texto
    end

    Agent-->>API: AgentResponse
    API-->>V: conversation_id, message, tool_calls
    V-->>U: Exibe resposta no chat
```

## Camadas e arquivos

| Etapa | Onde | Papel |
|---|---|---|
| UI | `src/modules/chat/pages/ChatPage.vue` | Chat, sugestões, bolhas |
| Estado | `src/modules/chat/store/chat.store.js` | Mensagens, `conversationId`, sending |
| HTTP | `src/modules/chat/services/chat.service.js` | `POST /chat` (timeout longo) |
| Rota API | `routes/api.php` → `ChatController` | Auth + orquestra o agent |
| Agent | `app/Ai/Agents/HospitableChatAgent.php` | Provider Ollama + tools MCP |
| LLM config | `config/ai.php` + `.env` (`OLLAMA_URL`, `AI_MODEL`) | Só Ollama ativo |
| MCP registro | `routes/ai.php` → `Mcp::local('hospitable', …)` | Servidor stdio |
| Tools | `app/Mcp/Tools/*` | Projetos, tarefas, fundos, custos, etc. |

## Pontos importantes

1. **MCP ≠ chat.** O MCP só expõe tools. Quem interpreta linguagem natural é o **Ollama (qwen2.5)**.
2. **Auth em duas camadas**
   - Frontend → API: usuário logado (Passport).
   - Tools MCP → domínio: conta de serviço `USER_LOGIN` / `PASSWORD_USER`.
3. **Ollama no Windows / API no WSL-Docker**  
   `OLLAMA_URL` deve apontar para o host Windows (ex.: `http://172.19.192.1:11434`), não `localhost` do container.
4. **Conversas** ficam em `agent_conversations` / `agent_conversation_messages` (`laravel/ai`).

## Exemplo ponta a ponta

1. Usuário: *“Crie um projeto ERP com moeda BRL começando hoje.”*
2. Vue → `POST /api/chat`.
3. Agent envia prompt + schemas das tools ao Qwen 2.5.
4. Qwen escolhe `store-project-tool` com `name`, `currency`, `starts_on`, `expected_ends_on`.
5. MCP executa a tool e grava o projeto.
6. Qwen responde em texto confirmando o `id` criado.
7. Vue mostra a resposta e, se houver, a tool usada na bolha.
