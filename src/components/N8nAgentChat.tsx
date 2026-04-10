import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import "./N8nAgentChat.css";

// ── Types ──────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string;

// ── Component ──────────────────────────────────────────────────────────────
export const N8nAgentChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const msgCounter = useRef(0);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    // Clear any previous error
    setError(null);

    // Append user bubble
    const userId = ++msgCounter.current;
    const userMsg: ChatMessage = { id: userId, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // n8n returns an array like [{ "output": "..." }]
      // We extract the text from the first element.
      let assistantText = "";
      if (typeof data === "string") {
        assistantText = data;
      } else if (Array.isArray(data)) {
        // Array format: pick the "output" from the first element
        const first = data[0];
        assistantText =
          first?.output ?? first?.response ?? first?.message ?? first?.text ?? JSON.stringify(first, null, 2);
      } else if (data.output) {
        assistantText = data.output;
      } else if (data.response) {
        assistantText = data.response;
      } else if (data.message) {
        assistantText = data.message;
      } else if (data.text) {
        assistantText = data.text;
      } else {
        assistantText = JSON.stringify(data, null, 2);
      }

      const assistantId = ++msgCounter.current;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        text: assistantText,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Failed to send message to n8n agent:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(`No se pudo conectar con el agente: ${errorMessage}`);

      // Also add an error bubble
      const errId = ++msgCounter.current;
      setMessages((prev) => [
        ...prev,
        {
          id: errId,
          role: "assistant",
          text: "❌ No se pudo obtener respuesta del agente. Verifica que n8n esté corriendo y el webhook esté activo.",
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
    setInputText("");
    setError(null);
    msgCounter.current = 0;
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="agent-chat-shell">
      {/* ── Top Navigation Bar ── */}
      <header className="agent-chat-navbar">
        <div className="agent-chat-navbar-brand">
          <span className="agent-chat-navbar-logo">⬡</span>
          <span className="agent-chat-navbar-title">ElyteSoft</span>
          <span className="agent-chat-navbar-subtitle">n8n Agent</span>
        </div>
        <div className="agent-chat-navbar-right">
          <div className="agent-chat-navbar-status">
            <span className="agent-chat-status-dot" />
            <span>Webhook activo</span>
          </div>
          <span className="agent-chat-navbar-badge">AI Agent</span>
        </div>
      </header>

      {/* ── Chat body ── */}
      <div className="agent-chat-body">
        {/* Panel header */}
        <div className="agent-chat-panel-header">
          <h2 className="agent-panel-title">Chat con Agente</h2>
          <button
            className="agent-btn-new-chat"
            onClick={handleNewConversation}
            title="Nueva conversación"
          >
            + Nueva conversación
          </button>
        </div>

        {/* Error toast */}
        {error && (
          <div className="agent-chat-error">
            <span className="agent-chat-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Messages area */}
        <div className="agent-chat-messages">
          {isEmpty && (
            <div className="agent-chat-welcome">
              <div className="agent-chat-welcome-icon">🤖</div>
              <p className="agent-chat-welcome-title">Agente de n8n</p>
              <p className="agent-chat-welcome-text">
                Envía un mensaje para interactuar con el agente. El agente
                procesará tu solicitud a través del flujo configurado en n8n.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`agent-bubble-wrapper ${msg.role === "user" ? "user" : "assistant"}`}
            >
              <div
                className={`agent-bubble ${msg.role === "user" ? "agent-bubble-user" : "agent-bubble-assistant"}`}
              >
                {msg.role === "assistant" ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatAgentResponse(msg.text),
                    }}
                  />
                ) : (
                  <span>{msg.text}</span>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="agent-bubble-wrapper assistant">
              <div className="agent-bubble agent-bubble-assistant agent-bubble-typing">
                <span className="agent-typing-dot" />
                <span className="agent-typing-dot" />
                <span className="agent-typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <form className="agent-chat-input-bar" onSubmit={handleFormSubmit}>
          <textarea
            ref={inputRef}
            className="agent-chat-input-field"
            placeholder="Escribe tu mensaje… (Enter para enviar)"
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            className="agent-chat-send-btn"
            disabled={!inputText.trim() || isLoading}
            title="Enviar"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Helper: basic text formatting for agent responses ──────────────────────
function formatAgentResponse(text: string): string {
  // Escape HTML first
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold (**...**)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Line breaks
  html = html.replace(/\n/g, "<br />");

  return html;
}
