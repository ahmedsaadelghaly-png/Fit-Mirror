"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/features/auth/hooks/use-register";
import { type RegisterFormValues, registerSchema } from "@/features/auth/schemas";

function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegister();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    await registerMutation.mutateAsync(values);
    // Phase 2.1 scope ends at "account created" — routing straight to
    // login rather than auto-signing-in keeps this form independent of
    // the login flow's token-handling logic.
    router.push("/login");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start with a free FitMirror AI account.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          autoComplete="name"
          aria-invalid={!!errors.full_name}
          aria-describedby={errors.full_name ? "full_name-error" : undefined}
          {...registerField("full_name")}
        />
        {errors.full_name && (
          <p id="full_name-error" className="text-sm text-destructive">
            {errors.full_name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...registerField("email")}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...registerField("password")}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {registerMutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {registerMutation.error instanceof ApiError
            ? registerMutation.error.message
            : "Something went wrong. Please try again."}
        </p>
      )}

      <Button type="submit" isLoading={registerMutation.isPending} className="mt-1">
        Create account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary-text hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export { RegisterForm };
