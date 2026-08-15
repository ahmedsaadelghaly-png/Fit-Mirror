"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { AuthFormError } from "@/features/auth/components/auth-form-error";
import { AuthFormField } from "@/features/auth/components/auth-form-field";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";
import { type ForgotPasswordFormValues, forgotPasswordSchema } from "@/features/auth/schemas";

/**
 * Calls the PLACEHOLDER `forgotPassword` API function (see
 * features/auth/api.ts) — the UI/UX here is real and complete, but no
 * email is actually sent until the backend implements this endpoint.
 */
function ForgotPasswordForm() {
  const forgotPasswordMutation = useForgotPassword();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    await forgotPasswordMutation.mutateAsync(values);
  });

  if (forgotPasswordMutation.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">{forgotPasswordMutation.data.message}</p>
        <Link href="/login" className="mt-2 text-sm font-medium text-primary-text hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you instructions to reset your password.
        </p>
      </div>

      <AuthFormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email}
        registration={registerField("email")}
      />

      {forgotPasswordMutation.isError && <AuthFormError error={forgotPasswordMutation.error} />}

      <Button type="submit" isLoading={forgotPasswordMutation.isPending} className="mt-1">
        Send reset instructions
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it after all?{" "}
        <Link href="/login" className="font-medium text-primary-text hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export { ForgotPasswordForm };
