import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/features/auth/components/login-form";
import { AuthProvider } from "@/providers/auth-provider";

// next/navigation's useRouter relies on Next's App Router context, which
// doesn't exist in a plain Vitest + Testing Library environment — mock it
// so AuthProvider/LoginForm can call useRouter() without throwing.
// vi.mock calls are hoisted above these imports by Vitest automatically.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function renderLoginForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe("LoginForm validation", () => {
  it("shows required-field errors when submitted empty", async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it("shows an email-format error for an invalid email", async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/^password$/i), "somepassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
  });

  it("renders a link to the register and forgot-password pages", () => {
    renderLoginForm();

    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });
});
