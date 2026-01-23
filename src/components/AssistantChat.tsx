import { useState, type FormEvent } from "react";
import { TextArea } from "./TextArea";
import { Button } from "./Button";
import { DynamicTable } from "./DynamicTable";
import "./AssistantChat.css";

export const AssistantChat = () => {
  const [userMessage, setUserMessage] = useState({
    message: "",
  });
  const [modelResponse, setModelResponse] = useState("");
  const [tableData, setTableData] = useState<Array<Record<string, any>>>([]);
  const [charCount, setCharCount] = useState(userMessage.message.length);
  const [isLoading, setIsLoading] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setUserMessage({ ...userMessage, message: newText });
    setCharCount(newText.length);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Text submitted:", userMessage.message);
    setIsLoading(true);

    // Sends the message to the LLM server
    try {
      const response = await fetch("http://127.0.0.1:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userMessage),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Response from LLM server:", data);
      // Handle success (e.g., show a message or clear the input)
      setModelResponse(data.content);
      if (data.table_data) {
        setTableData(data.table_data);
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Handle error (e.g., show an error message)
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
          placeholder="..."
          value={userMessage.message}
          onChange={handleTextChange}
          rows={8}
          autoFocus={true}
        />

        {/* Character Count */}
        <div className="assistant-chat-text-info">
          <span className="char-count">{charCount} characters</span>
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
            {isLoading ? "Enviando..." : "Submit"}
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
