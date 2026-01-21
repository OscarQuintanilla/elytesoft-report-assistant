import { type ReactNode, type ButtonHTMLAttributes } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "social";
  children: ReactNode;
  icon?: string;
}

export const Button = ({
  variant = "primary",
  children,
  icon,
  className = "",
  ...props
}: ButtonProps) => {
  const buttonClass =
    `btn ${variant === "primary" ? "btn-primary" : "btn-social"} ${className}`.trim();

  return (
    <button className={buttonClass} {...props}>
      {icon && <span className="social-icon">{icon}</span>}
      {children}
    </button>
  );
};
