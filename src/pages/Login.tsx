import { AnimatedBackground } from "../components/AnimatedBackground";
import { LoginCard } from "../components/LoginCard";
import "./Login.css";

export const Login = () => {
  return (
    <div className="page-container">
      <AnimatedBackground />
      <LoginCard />
    </div>
  );
};
