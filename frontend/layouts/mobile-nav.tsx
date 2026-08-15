"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { NavItem } from "@/config/navigation";
import { useUIStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import { Logo } from "@/shared/components/logo";

export interface MobileNavProps {
  navItems: NavItem[];
  areaLabel: string;
}

/**
 * The mobile equivalent of DashboardSidebar — a left-edge slide-over
 * instead of a fixed column, shown below the `md` breakpoint. Built on
 * the same Radix Dialog primitive as components/ui/dialog.tsx, but with
 * its own positioning (edge sheet, not centered modal) since that visual
 * pattern is specific to navigation drawers.
 */
function MobileNav({ navItems, areaLabel }: MobileNavProps) {
  const pathname = usePathname();
  const isOpen = useUIStore((state) => state.isMobileNavOpen);
  const setOpen = useUIStore((state) => state.setMobileNavOpen);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-surface duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b px-4">
            <div className="flex flex-col gap-0.5">
              <Logo className="text-base" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {areaLabel}
              </span>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close navigation">
                <X className="size-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-3" aria-label={`${areaLabel} navigation`}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              if (item.comingSoon) {
                return (
                  <span
                    key={item.href}
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                    <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                      Soon
                    </span>
                  </span>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { MobileNav };
