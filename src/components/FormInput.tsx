import { type ChangeEvent } from "react";
import "./FormInput.css";

interface FormInputProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  icon: string;
  required?: boolean;
}

export const FormInput = ({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  icon,
  required = false,
}: FormInputProps) => {
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrapper">
        <input
          type={type}
          id={id}
          className="form-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
        />
        <span className="input-icon">{icon}</span>
      </div>
    </div>
  );
};
