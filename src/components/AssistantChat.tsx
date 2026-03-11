import { useState, useCallback, type FormEvent, type ChangeEvent } from "react";
import { TextArea } from "./TextArea";
import { Button } from "./Button";
import { DynamicTable } from "./DynamicTable";
import { VoiceRecorderButton } from "./VoiceRecorderButton";
import "./AssistantChat.css";

export const AssistantChat = () => {
  const [userMessage, setUserMessage] = useState({ message: "" });
  const [modelResponse, setModelResponse] = useState("");
  const [tableData, setTableData] = useState<Array<Record<string, any>>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleTranscriptChange = useCallback((text: string) => {
    setUserMessage((prev) => ({ ...prev, message: text }));
  }, []);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setUserMessage({ ...userMessage, message: e.target.value });
  };

  const cleanSqlQuery = (rawQuery: string): string => {
    let cleaned = rawQuery.trim();
    cleaned = cleaned.replace(/^```(?:sql|SQL)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/i, "");
    cleaned = cleaned.replace(/^`+|`+$/g, "");
    return cleaned.trim();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTableData([]);

    try {
      const llmResponse = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userMessage),
      });

      if (!llmResponse.ok) throw new Error(`Error: ${llmResponse.statusText}`);

      const llmData = await llmResponse.json();
      setModelResponse(llmData.content);

      const sqlQuery = cleanSqlQuery(llmData.content);
      const upperQuery = sqlQuery.toUpperCase();

      if (upperQuery && (upperQuery.includes("SELECT") || upperQuery.includes("EXEC"))) {
        const sqlResponse = await fetch("http://127.0.0.1:8000/api/execute-sql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: sqlQuery }),
        });

        if (!sqlResponse.ok) throw new Error(`Error executing SQL: ${sqlResponse.statusText}`);

        const sqlData = await sqlResponse.json();
        if (sqlData.error) {
          setTableData([]);
        } else if (sqlData.table_data && sqlData.table_data.length > 0) {
          setTableData(sqlData.table_data);
        } else {
          setTableData([]);
        }
      }
    } catch (error) {
      console.error("Failed to process request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUserMessage({ message: "" });
    setModelResponse("");
    setTableData([]);
  };

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
        {/* Left: Query Panel */}
        <aside className="chat-panel-left">
          <div className="chat-panel-header">
            <h2 className="panel-title">Nueva consulta</h2>
            <p className="panel-subtitle">
              Describe el informe que necesitas y el asistente lo procesará automáticamente.
            </p>
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <TextArea
              id="main-text"
              label="Descripción"
              placeholder="Ej: Muéstrame las ventas por tipo de cliente del mes pasado..."
              value={userMessage.message}
              onChange={handleTextChange}
              rows={10}
              autoFocus={true}
            />

            <div className="chat-form-actions">
              <VoiceRecorderButton
                onTranscriptChange={handleTranscriptChange}
                disabled={isLoading}
              />
            </div>

            <div className="chat-button-group">
              <Button
                type="button"
                variant="social"
                onClick={handleClear}
                disabled={userMessage.message.length === 0 || isLoading}
              >
                Limpiar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={userMessage.message.length === 0 || isLoading}
              >
                {isLoading ? "Procesando…" : "Solicitar informe"}
              </Button>
            </div>
          </form>
        </aside>

        {/* Right: Results Panel */}
        <main className="chat-panel-right">
          {!modelResponse && !isLoading && (
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

          {!isLoading && modelResponse && (
            <div className="chat-results">
              <div className="chat-sql-block">
                <span className="chat-sql-label">SQL generado</span>
                <pre className="chat-sql-code">{modelResponse}</pre>
              </div>

              {tableData.length > 0 ? (
                <DynamicTable data={tableData} />
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
