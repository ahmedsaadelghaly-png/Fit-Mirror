"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminNav, brandNav, publicNav, shopperNav } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";

function useToggleShortcut(onToggle: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onToggle();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggle]);
}

/**
 * Global command palette — PLACEHOLDER (basic substring filter, not fuzzy
 * search; no `cmdk` dependency added for this pass — see
 * docs/frontend/UX_SYSTEM.md "Global command palette"). Opens on
 * Cmd+K/Ctrl+K from anywhere, navigates the current role's nav items
 * (`config/navigation.ts`) — the same list already driving the sidebar,
 * so there's exactly one source of truth for "what pages exist for this
 * role," not a second hand-maintained list.
 */
function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { currentUser } = useAuth();

  useToggleShortcut(() => setOpen((prev) => !prev));

  const roleNav =
    currentUser?.role === "brand_admin"
      ? brandNav
      : currentUser?.role === "platform_admin"
        ? adminNav
        : currentUser?.role === "shopper"
          ? shopperNav
          : publicNav;

  const results = roleNav.filter(
    (item) => !item.comingSoon && item.label.toLowerCase().includes(query.toLowerCase()),
  );

  const goTo = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogContent
        className="top-24 max-w-lg -translate-y-0 gap-0 p-0"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="border-b p-2">
          <Input
            autoFocus
            placeholder="Search pages… (Cmd+K)"
            aria-label="Command palette search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <ul
          role="listbox"
          aria-label="Command palette results"
          className="max-h-80 overflow-y-auto p-2"
        >
          {results.length === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-muted-foreground">
              No matching pages
            </li>
          ) : (
            results.map((item) => (
              <li key={item.href}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => goTo(item.href)}
                >
                  <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  {item.label}
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export { CommandPalette };
