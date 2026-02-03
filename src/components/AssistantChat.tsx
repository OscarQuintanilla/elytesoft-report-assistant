import { useState, useCallback, type FormEvent } from "react";
import { TextArea } from "./TextArea";
import { Button } from "./Button";
import { DynamicTable } from "./DynamicTable";
import { VoiceRecorderButton } from "./VoiceRecorderButton";
import "./AssistantChat.css";

export const AssistantChat = () => {
  const [userMessage, setUserMessage] = useState({
    message: "",
  });
  const [modelResponse, setModelResponse] = useState("");
  const [tableData, setTableData] = useState<Array<Record<string, any>>>([]);
  const [charCount, setCharCount] = useState(userMessage.message.length);
  const [isLoading, setIsLoading] = useState(false);

  // Handle voice transcript updates
  const handleTranscriptChange = useCallback((text: string) => {
    setUserMessage((prev) => ({ ...prev, message: text }));
    setCharCount(text.length);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setUserMessage({ ...userMessage, message: newText });
    setCharCount(newText.length);
  };

  // Clean SQL query from markdown code blocks and extra characters
  const cleanSqlQuery = (rawQuery: string): string => {
    let cleaned = rawQuery.trim();

    // Remove markdown code blocks (```sql ... ``` or ``` ... ```)
    cleaned = cleaned.replace(/^```(?:sql|SQL)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/i, "");

    // Remove any remaining backticks at start/end
    cleaned = cleaned.replace(/^`+|`+$/g, "");

    // Trim whitespace again
    cleaned = cleaned.trim();

    return cleaned;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Text submitted:", userMessage.message);
    setIsLoading(true);
    setTableData([]);

    try {
      // Step 1: Send message to LLM to generate SQL query
      console.log("User message:", userMessage);
      const llmResponse = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userMessage),
      });

      if (!llmResponse.ok) {
        throw new Error(`Error: ${llmResponse.statusText}`);
      }

      console.log("LLM Response:", llmResponse);

      const llmData = await llmResponse.json();
      console.log("LLM Data:", JSON.stringify(llmData));
      console.log("SQL Query from LLM:", llmData.content);
      setModelResponse(llmData.content);

      // Step 2: Execute the generated SQL query against the database
      const sqlQuery = cleanSqlQuery(llmData.content);
      console.log("Cleaned SQL Query:", sqlQuery);

      // Only execute if it looks like a valid SQL query
      if (sqlQuery && sqlQuery.toUpperCase().includes("SELECT")) {
        const sqlResponse = await fetch(
          "http://127.0.0.1:8000/api/execute-sql",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: sqlQuery }),
          },
        );

        if (!sqlResponse.ok) {
          throw new Error(`Error executing SQL: ${sqlResponse.statusText}`);
        }

        const sqlData = await sqlResponse.json();
        console.log("Data from database:", sqlData);

        if (sqlData.error) {
          console.error("SQL Error:", sqlData.error);
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
    setUserMessage({ ...userMessage, message: "" });
    setCharCount(0);
    setModelResponse("");
    setTableData([]);
  };

  return (
    <div className="assistant-chat">
      {/* Header Section */}
      <div className="assistant-chat-header">
        <div className="header-icon">📝</div>
        <h1>Solicitar Informe</h1>
        <p>Introduce el tipo de informe que deseas que el asistente procese</p>
      </div>

      {/* Text Form */}
      <form className="assistant-chat-form" onSubmit={handleSubmit}>
        <TextArea
          id="main-text"
          label="Descripción:"
          placeholder="Describe el informe que necesitas..."
          value={userMessage.message}
          onChange={handleTextChange}
          rows={8}
          autoFocus={true}
        />

        {/* Input Actions Bar */}
        <div className="assistant-chat-actions-bar">
          <VoiceRecorderButton
            onTranscriptChange={handleTranscriptChange}
            disabled={isLoading}
          />
        </div>

        {/* Action Buttons */}
        <div className="assistant-chat-button-group">
          <Button
            type="button"
            variant="social"
            onClick={handleClear}
            disabled={userMessage.message.length === 0 || isLoading}
          >
            Clear
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={userMessage.message.length === 0 || isLoading}
          >
            {isLoading ? "Enviando..." : "Solicitar informe"}
          </Button>
        </div>
      </form>

      {/* Footer */}
      <div className="assistant-chat-footer">
        <section className="footer-text">Respuesta:</section>
        <section className="footer-text">
          <h3>{modelResponse}</h3>
          {tableData.length > 0 && <DynamicTable data={tableData} />}
        </section>
      </div>
    </div>
  );
};
