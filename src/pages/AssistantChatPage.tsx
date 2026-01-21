import { AnimatedBackground } from "../components/AnimatedBackground";
import { AssistantChat } from "../components/AssistantChat";
import "../components/AssistantChat.css";

export const AssistantChatPage = () => {
  return (
    <div className="page-container">
      <AnimatedBackground />
      <AssistantChat />
    </div>
  );
};
