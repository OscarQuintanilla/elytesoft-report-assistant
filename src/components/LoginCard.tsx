import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FormInput } from "./FormInput";
import { Button } from "./Button";
import "./LoginCard.css";

export const LoginCard = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password, rememberMe });
    // Navigate to AssistantChat page
    navigate("/chat");
  };

  return (
    <div className="login-card">
      {/* Logo Section */}
      <div className="logo-section">
        <div className="logo-icon">🚀</div>
        <h1>ElyteSoft </h1>
        <h2>Report Assistant</h2>
        <p>Sign in to continue to your account</p>
      </div>

      {/* Login Form */}
      <form className="login-form" onSubmit={handleSubmit}>
        <FormInput
          id="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon="📧"
          required
        />

        <FormInput
          id="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon="🔒"
          required
        />

        <div className="form-options">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember">Remember me</label>
          </div>
          <a href="#" className="forgot-link">
            Forgot password?
          </a>
        </div>

        <Button type="submit" variant="primary">
          Sign In
        </Button>
      </form>

      {/* Divider */}
      {/* <div className="divider">or continue with</div> */}

      {/* Social Login */}
      {/* <div className="social-buttons">
        <Button variant="social" type="button" icon="🔵">
          Google
        </Button>
        <Button variant="social" type="button" icon="⚫">
          GitHub
        </Button>
      </div> */}

      {/* Footer */}
      <div className="card-footer">
        Don't have an account?{" "}
        <a href="#" className="signup-link">
          Sign up
        </a>
      </div>
    </div>
  );
};
