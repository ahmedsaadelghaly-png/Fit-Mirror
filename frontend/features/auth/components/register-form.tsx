"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { AuthFormError } from "@/features/auth/components/auth-form-error";
import { AuthFormField } from "@/features/auth/components/auth-form-field";
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

      <AuthFormField
        id="full_name"
        label="Full name"
        autoComplete="name"
        error={errors.full_name}
        registration={registerField("full_name")}
      />

      <AuthFormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email}
        registration={registerField("email")}
      />

      <AuthFormField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password}
        registration={registerField("password")}
      />

      {registerMutation.isError && <AuthFormError error={registerMutation.error} />}

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
