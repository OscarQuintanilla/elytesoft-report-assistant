import { type ChangeEvent } from "react";
import "./TextArea.css";

interface TextAreaProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  required?: boolean;
  autoFocus?: boolean;
}

export const TextArea = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  rows = 6,
  required = false,
  autoFocus = false,
}: TextAreaProps) => {
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="textarea-wrapper">
        <textarea
          id={id}
          className="form-textarea"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows}
          required={required}
          autoFocus={autoFocus}
        />
      </div>
    </div>
  );
};
