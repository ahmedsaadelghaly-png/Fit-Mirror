"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchCurrentUser } from "@/features/auth/api";
import { useLogin } from "@/features/auth/hooks/use-login";
import { type LoginFormValues, loginSchema } from "@/features/auth/schemas";
import { useAuth } from "@/hooks/use-auth";
import { setAccessToken } from "@/lib/auth-token";
import type { User, UserRole } from "@/types/domain";

const roleHome: Record<UserRole, string> = {
  shopper: "/shopper",
  brand_admin: "/brand",
  platform_admin: "/admin",
};

function LoginForm() {
  const router = useRouter();
  const { login: startSession } = useAuth();
  const loginMutation = useLogin();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    const tokens = await loginMutation.mutateAsync(values);
    // Set the token first so the /users/me call below is authenticated —
    // see api/client.ts's request interceptor.
    setAccessToken(tokens.access_token);
    const user = (await fetchCurrentUser()) as User;
    startSession(tokens, user);
    router.push(roleHome[user.role]);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Log in to your FitMirror AI account.</p>
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary-text hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
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

      {loginMutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {loginMutation.error instanceof ApiError
            ? loginMutation.error.message
            : "Something went wrong. Please try again."}
        </p>
      )}

      <Button type="submit" isLoading={loginMutation.isPending} className="mt-1">
        Log in
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary-text hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}

export { LoginForm };
