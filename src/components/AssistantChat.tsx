import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { DynamicTable } from "./DynamicTable";
import { VoiceRecorderButton } from "./VoiceRecorderButton";
import "./AssistantChat.css";

// ── Types ──────────────────────────────────────────────────────────────────
interface LLMHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  tableData?: Array<Record<string, any>>;
  rowCount?: number;
}

// ── Component ──────────────────────────────────────────────────────────────
export const AssistantChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [llmHistory, setLlmHistory] = useState<LLMHistoryEntry[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [latestTableData, setLatestTableData] = useState<
    Array<Record<string, any>>
  >([]);
  const [latestSql, setLatestSql] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgCounter = useRef(0);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const cleanSqlQuery = (rawQuery: string): string => {
    let cleaned = rawQuery.trim();
    cleaned = cleaned.replace(/^```(?:sql|SQL)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/i, "");
    cleaned = cleaned.replace(/^`+|`+$/g, "");
    return cleaned.trim();
  };

  const handleTranscriptChange = useCallback((text: string) => {
    setInputText(text);
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    // Append user bubble
    const userId = ++msgCounter.current;
    const userMsg: ChatMessage = { id: userId, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      // 1. Send to LLM
      const llmResponse = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: llmHistory }),
      });

      if (!llmResponse.ok)
        throw new Error(`LLM Error: ${llmResponse.statusText}`);

      const llmData = await llmResponse.json();
      const sqlRaw: string = llmData.content ?? "";
      const updatedHistory: LLMHistoryEntry[] = llmData.history ?? [];
      setLlmHistory(updatedHistory);

      const sqlQuery = cleanSqlQuery(sqlRaw);
      const upperQuery = sqlQuery.toUpperCase();

      let tableData: Array<Record<string, any>> = [];

      // 2. Execute SQL if applicable
      if (
        upperQuery &&
        (upperQuery.includes("SELECT") || upperQuery.includes("EXEC"))
      ) {
        const sqlResponse = await fetch(
          "http://127.0.0.1:8000/api/execute-sql",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: sqlQuery }),
          },
        );

        if (sqlResponse.ok) {
          const sqlData = await sqlResponse.json();
          if (!sqlData.error && sqlData.table_data?.length > 0) {
            tableData = sqlData.table_data;
          }
        }

        setLatestSql(sqlQuery);
        setLatestTableData(tableData);
      }

      // 3. Append assistant bubble
      const assistantId = ++msgCounter.current;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        text: sqlRaw,
        tableData,
        rowCount: tableData.length,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Failed to process request:", error);
      const errId = ++msgCounter.current;
      setMessages((prev) => [
        ...prev,
        {
          id: errId,
          role: "assistant",
          text: "❌ Error al procesar la solicitud.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setLlmHistory([]);
    setLatestTableData([]);
    setLatestSql("");
    setInputText("");
    msgCounter.current = 0;
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="chat-shell">
      {/* ── Top Navigation Bar ── */}
      <header className="chat-navbar">
        <div className="chat-navbar-brand">
          <span className="chat-navbar-logo">⬡</span>
          <span className="chat-navbar-title">ElyteSoft</span>
          <span className="chat-navbar-subtitle">Report Assistant</span>
        </div>
        <div className="chat-navbar-right">
          <span className="chat-navbar-badge">Business Intelligence</span>
        </div>
      </header>

      {/* ── Two-column body ── */}
      <div className="chat-body">
        {/* Left: Chat Panel */}
        <aside className="chat-panel-left">
          {/* Panel header */}
          <div className="chat-panel-header">
            <h2 className="panel-title">Solicitar Reportes</h2>
            <button
              className="btn-new-chat"
              onClick={handleNewConversation}
              title="Nueva conversación"
            >
              + Nueva consulta
            </button>
          </div>

          {/* Messages area */}
          <div className="chat-messages">
            {isEmpty && (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">💬</div>
                <p className="chat-welcome-text">
                  Describe el informe que necesitas. Puedes pedir cambios y
                  ajustes en mensajes posteriores.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble-wrapper ${msg.role === "user" ? "user" : "assistant"}`}
              >
                <div
                  className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}
                >
                  {msg.role === "assistant" ? (
                    <>
                      <span className="bubble-label">SQL generado</span>
                      <pre className="bubble-sql">{msg.text}</pre>
                      {msg.rowCount !== undefined && (
                        <span className="bubble-meta">
                          {msg.rowCount > 0
                            ? `${msg.rowCount} fila${msg.rowCount !== 1 ? "s" : ""} devuelta${msg.rowCount !== 1 ? "s" : ""}`
                            : "Sin resultados"}
                        </span>
                      )}
                    </>
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chat-bubble-wrapper assistant">
                <div className="chat-bubble chat-bubble-assistant chat-bubble-typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <form className="chat-input-bar" onSubmit={handleFormSubmit}>
            <VoiceRecorderButton
              onTranscriptChange={handleTranscriptChange}
              disabled={isLoading}
            />
            <textarea
              ref={inputRef}
              className="chat-input-field"
              placeholder="Escribe tu consulta… (Enter para enviar)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputText.trim() || isLoading}
              title="Enviar"
            >
              ➤
            </button>
          </form>
        </aside>

        {/* Right: Results Panel */}
        <main className="chat-panel-right">
          {!latestSql && !isLoading && (
            <div className="chat-empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>Los resultados aparecerán aquí</h3>
              <p>Ingresa una consulta en el panel izquierdo para comenzar.</p>
            </div>
          )}

          {isLoading && (
            <div className="chat-empty-state">
              <div className="chat-spinner" />
              <p className="chat-loading-text">Consultando la base de datos…</p>
            </div>
          )}

          {!isLoading && latestSql && (
            <div className="chat-results">
              <div className="chat-sql-block">
                <span className="chat-sql-label">SQL generado</span>
                <pre className="chat-sql-code">{latestSql}</pre>
              </div>

              {latestTableData.length > 0 ? (
                <DynamicTable data={latestTableData} />
              ) : (
                <p className="chat-no-rows">La consulta no devolvió filas.</p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
