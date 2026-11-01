"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { AuthFormError } from "@/features/auth/components/auth-form-error";
import { AuthFormField } from "@/features/auth/components/auth-form-field";
import { useResetPassword } from "@/features/auth/hooks/use-reset-password";
import { type ResetPasswordFormValues, resetPasswordSchema } from "@/features/auth/schemas";

/**
 * The page the emailed reset link opens (`/reset-password?token=...`).
 * `POST /auth/reset-password` rejects unknown, used or expired links with
 * a 422 whose message is shown as-is, alongside a way to ask for a new one.
 */
function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const resetMutation = useResetPassword();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = handleSubmit((values) => {
    resetMutation.mutate({ token, new_password: values.new_password });
  });

  if (!token) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <h1 className="font-display text-2xl font-semibold">This link is incomplete</h1>
        <p className="text-sm text-muted-foreground">
          Open the link from your email again, or ask for a new one.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary-text hover:underline"
        >
          Send a new reset link
        </Link>
      </div>
    );
  }

  if (resetMutation.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-semibold">Password updated</h1>
        <p className="text-sm text-muted-foreground">{resetMutation.data.message}</p>
        <Button asChild className="mt-2">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">
          At least 8 characters. You&apos;ll be signed out on your other devices.
        </p>
      </div>

      <AuthFormField
        id="new_password"
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.new_password}
        registration={registerField("new_password")}
      />
      <AuthFormField
        id="confirm_password"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirm_password}
        registration={registerField("confirm_password")}
      />

      {resetMutation.isError && <AuthFormError error={resetMutation.error} />}

      <Button type="submit" isLoading={resetMutation.isPending} className="mt-1">
        Update password
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Link expired?{" "}
        <Link href="/forgot-password" className="font-medium text-primary-text hover:underline">
          Send a new one
        </Link>
      </p>
    </form>
  );
}

export { ResetPasswordForm };
