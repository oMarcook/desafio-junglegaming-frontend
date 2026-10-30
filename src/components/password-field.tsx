import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordField({
  label,
  name,
  error,
  autoComplete = "new-password",
}: {
  label: string;
  name: string;
  error?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false),
    id = useId();
  return (
    <div className="field password-field">
      <label htmlFor={id}>{label}</label>
      <div>
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
