import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  // Suspense: the form reads `?token=` via useSearchParams.
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
