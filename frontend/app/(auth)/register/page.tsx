import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  // Suspense: the form reads `?type=brand` via useSearchParams.
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
