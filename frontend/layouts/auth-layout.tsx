import { Logo } from "@/shared/components/logo";
import { ThemeToggle } from "@/shared/components/theme-toggle";

/**
 * Centered card layout for login/register. The right-side reflective
 * panel is the signature "mirror" motif (see docs/frontend/DESIGN_SYSTEM.md
 * "Signature element") — hidden below `lg` where there's no room for it
 * without crowding the form.
 */
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-between p-6 md:p-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div id="main-content" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FitMirror AI
        </p>
      </div>

      <div
        aria-hidden="true"
        className="sheen-surface sheen-animate relative hidden overflow-hidden bg-foreground lg:block"
      >
        <div className="absolute inset-0 flex items-center justify-center p-16">
          <div className="max-w-md space-y-4 text-center">
            <p className="font-display text-3xl font-semibold leading-tight text-background/90">
              See it on, before it&apos;s yours.
            </p>
            <p className="text-sm text-background/60">
              AI-powered virtual try-on, a wardrobe that knows your fit, and a stylist that never
              sleeps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AuthLayout };
