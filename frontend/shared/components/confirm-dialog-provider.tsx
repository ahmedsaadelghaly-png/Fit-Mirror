"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button as `variant="destructive"` — use for delete/suspend/deactivate-style actions. */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

/**
 * Imperative confirmation dialog system — `await confirm({...})` resolves
 * `true`/`false` instead of every destructive action hand-rolling its own
 * `<Dialog>` + local `open` state. Mounted once in
 * providers/app-providers.tsx. See docs/frontend/UX_SYSTEM.md
 * "Confirmation dialog system".
 *
 * Applied as a reference example to the Admin Stores "Suspend" action
 * (features/admin/components/stores/stores-table.tsx) — not retrofitted
 * into every existing destructive action across Shopper/Brand/Admin in
 * this pass (a much larger diff); adopt the same `useConfirm()` call
 * anywhere else a destructive action currently fires immediately on click.
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise((resolve) => setPending({ options, resolve }));
  }, []);

  const settle = (result: boolean) => {
    pending?.resolve(result);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={!!pending} onOpenChange={(open) => !open && settle(false)}>
        <DialogContent className="max-w-sm">
          {pending && (
            <>
              <DialogHeader>
                <DialogTitle>{pending.options.title}</DialogTitle>
                {pending.options.description && (
                  <DialogDescription>{pending.options.description}</DialogDescription>
                )}
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => settle(false)}>
                  {pending.options.cancelLabel ?? "Cancel"}
                </Button>
                <Button
                  variant={pending.options.destructive ? "destructive" : "default"}
                  onClick={() => settle(true)}
                >
                  {pending.options.confirmLabel ?? "Confirm"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  }
  return context;
}
