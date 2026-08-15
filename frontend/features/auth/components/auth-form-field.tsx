import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AuthFormFieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: FieldError;
  registration: UseFormRegisterReturn;
  /** Extra content next to the label — e.g. login's "Forgot password?" link. */
  labelExtra?: React.ReactNode;
}

/**
 * The Label+Input+error markup shared identically by LoginForm,
 * RegisterForm, and ForgotPasswordForm (previously hand-duplicated three
 * times). Purely presentational — each form still owns its own
 * `useForm`/`zodResolver`/mutation call, this only renders one field's
 * chrome and preserves the exact aria-invalid/aria-describedby wiring.
 */
function AuthFormField({
  id,
  label,
  type = "text",
  autoComplete,
  error,
  registration,
  labelExtra,
}: AuthFormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {labelExtra}
      </div>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...registration}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

export { AuthFormField };
