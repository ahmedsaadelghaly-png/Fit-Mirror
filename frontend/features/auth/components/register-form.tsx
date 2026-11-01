"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { AuthFormError } from "@/features/auth/components/auth-form-error";
import { AuthFormField } from "@/features/auth/components/auth-form-field";
import { useRegister } from "@/features/auth/hooks/use-register";
import { type RegisterFormValues, registerSchema } from "@/features/auth/schemas";
import type { AccountType } from "@/types/auth";

const ACCOUNT_TYPES: { value: AccountType; label: string; description: string }[] = [
  { value: "shopper", label: "I'm shopping", description: "Try on, size and style outfits" },
  { value: "brand", label: "I'm a brand", description: "Open a store and list products" },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerMutation = useRegister();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    // `/register?type=brand` (the "Open your store" CTAs) preselects a brand account.
    defaultValues: { account_type: searchParams.get("type") === "brand" ? "brand" : "shopper" },
  });

  const onSubmit = handleSubmit(async (values) => {
    await registerMutation.mutateAsync(values);
    // Routing straight to login rather than auto-signing-in keeps this form
    // independent of the login flow's token handling. After logging in, a
    // brand account lands on store setup (no store yet).
    router.push("/login");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start with a free FitMirror AI account.</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Account type</legend>
        <div className="grid grid-cols-2 gap-2">
          {ACCOUNT_TYPES.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 text-sm transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-1 has-[:focus-visible]:ring-2 has-[:checked]:ring-primary has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                value={option.value}
                className="sr-only"
                {...registerField("account_type")}
              />
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

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
