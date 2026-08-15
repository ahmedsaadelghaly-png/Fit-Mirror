import { ApiError } from "@/api/client";

export interface AuthFormErrorProps {
  error: unknown;
}

/** The mutation-error line shared identically by all three auth forms. */
function AuthFormError({ error }: AuthFormErrorProps) {
  return (
    <p role="alert" className="text-sm text-destructive">
      {error instanceof ApiError ? error.message : "Something went wrong. Please try again."}
    </p>
  );
}

export { AuthFormError };
