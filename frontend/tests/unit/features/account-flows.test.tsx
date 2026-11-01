import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/client";
import { ChangePasswordCard } from "@/features/auth/components/account-settings";
import { RegisterForm } from "@/features/auth/components/register-form";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

const { resetPasswordMock, registerMock, changePasswordMock, searchParams, setTokensMock } =
  vi.hoisted(() => ({
    resetPasswordMock: vi.fn(),
    registerMock: vi.fn(),
    changePasswordMock: vi.fn(),
    searchParams: { current: new URLSearchParams() },
    setTokensMock: vi.fn(),
  }));

vi.mock("@/features/auth/api", () => ({
  resetPassword: resetPasswordMock,
  register: registerMock,
  changePassword: changePasswordMock,
}));
vi.mock("@/lib/auth-token", () => ({ setTokens: setTokensMock }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => searchParams.current,
}));

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  searchParams.current = new URLSearchParams();
});

describe("ResetPasswordForm", () => {
  it("explains an incomplete link instead of showing the form", () => {
    renderWithClient(<ResetPasswordForm />);
    expect(screen.getByText(/this link is incomplete/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /send a new reset link/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  it("requires matching passwords, then resets with the link's token", async () => {
    searchParams.current = new URLSearchParams("token=abc123token");
    resetPasswordMock.mockResolvedValueOnce({ message: "Your password has been reset." });
    const user = userEvent.setup();
    renderWithClient(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/^new password$/i), "NewPass456!");
    await user.type(screen.getByLabelText(/confirm new password/i), "Different1!");
    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(await screen.findByText(/passwords don't match/i)).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/confirm new password/i));
    await user.type(screen.getByLabelText(/confirm new password/i), "NewPass456!");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
    expect(resetPasswordMock).toHaveBeenCalledWith(
      { token: "abc123token", new_password: "NewPass456!" },
      expect.anything(),
    );
  });

  it("shows the server's message for an expired link", async () => {
    searchParams.current = new URLSearchParams("token=expiredtoken");
    resetPasswordMock.mockRejectedValueOnce(
      new ApiError(
        "This reset link is invalid or has expired. Request a new one.",
        422,
        "validation_error",
      ),
    );
    const user = userEvent.setup();
    renderWithClient(<ResetPasswordForm />);

    await user.type(screen.getByLabelText(/^new password$/i), "NewPass456!");
    await user.type(screen.getByLabelText(/confirm new password/i), "NewPass456!");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
  });
});

describe("RegisterForm account type", () => {
  it("preselects a brand account from ?type=brand and sends it", async () => {
    searchParams.current = new URLSearchParams("type=brand");
    registerMock.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderWithClient(<RegisterForm />);

    expect(screen.getByRole("radio", { name: /i'm a brand/i })).toBeChecked();

    await user.type(screen.getByLabelText(/full name/i), "Atelier Owner");
    await user.type(screen.getByLabelText(/email/i), "owner@atelier.example");
    await user.type(screen.getByLabelText(/^password$/i), "BrandPass1!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await vi.waitFor(() =>
      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({ account_type: "brand", email: "owner@atelier.example" }),
        expect.anything(),
      ),
    );
  });

  it("defaults to a shopper account", () => {
    renderWithClient(<RegisterForm />);
    expect(screen.getByRole("radio", { name: /i'm shopping/i })).toBeChecked();
  });
});

describe("ChangePasswordCard", () => {
  it("changes the password and keeps the session with the fresh tokens", async () => {
    changePasswordMock.mockResolvedValueOnce({
      access_token: "new-access",
      refresh_token: "new-refresh",
      token_type: "bearer",
    });
    const user = userEvent.setup();
    renderWithClient(<ChangePasswordCard />);

    await user.type(screen.getByLabelText(/current password/i), "OldPass123!");
    await user.type(screen.getByLabelText(/^new password$/i), "NewPass456!");
    await user.type(screen.getByLabelText(/confirm new password/i), "NewPass456!");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(await screen.findByText(/your password has been changed/i)).toBeInTheDocument();
    expect(setTokensMock).toHaveBeenCalledWith("new-access", "new-refresh");
  });
});
