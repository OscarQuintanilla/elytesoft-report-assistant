import { useEffect } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import "./VoiceRecorderButton.css";

interface VoiceRecorderButtonProps {
  onTranscriptChange: (text: string) => void;
  disabled?: boolean;
}

export const VoiceRecorderButton = ({
  onTranscriptChange,
  disabled = false,
}: VoiceRecorderButtonProps) => {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition("es-ES");

  // Send transcript updates to parent
  useEffect(() => {
    const fullText = transcript + interimTranscript;
    if (fullText) {
      onTranscriptChange(fullText);
    }
  }, [transcript, interimTranscript, onTranscriptChange]);

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Determine button state class
  const getButtonClass = () => {
    const classes = ["voice-recorder-btn"];

    if (!isSupported) {
      classes.push("unsupported");
    } else if (error) {
      classes.push("error");
    } else if (isListening) {
      classes.push("listening");
    }

    return classes.join(" ");
  };

  // Determine icon
  const getIcon = () => {
    if (!isSupported) return "🚫";
    if (error) return "⚠️";
    return "🎤";
  };

  // Get button label text
  const getLabel = () => {
    if (!isSupported) return "No soportado";
    if (error) return "Error";
    if (isListening) return "Grabando...";
    // el mensaje debe dejar claro que se puede hablar para pedir un tipo de informe
    return "Solicitar informe usando tu voz";
  };

  return (
    <div className="voice-recorder-container">
      <button
        type="button"
        className={getButtonClass()}
        onClick={handleClick}
        disabled={disabled || !isSupported}
        title={
          !isSupported
            ? "Speech recognition not supported"
            : isListening
              ? "Click to stop listening"
              : "Click to start voice input"
        }
        aria-label={
          isListening ? "Stop voice recording" : "Start voice recording"
        }
      >
        {getIcon()}
      </button>
      <span className="voice-recorder-label">{getLabel()}</span>
      {error && <span className="voice-recorder-error">{error}</span>}
    </div>
  );
};
