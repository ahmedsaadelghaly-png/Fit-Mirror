import { create } from "zustand";

/**
 * Global UI state that doesn't belong to server data (that's TanStack
 * Query's job) or to a single component's local state — things multiple,
 * unrelated components need to read/toggle, like sidebar collapse or the
 * mobile nav sheet. See docs/frontend/FRONTEND_ARCHITECTURE.md "State
 * management" for the decision rule on Query vs. Zustand vs. local state.
 */
interface UIState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  isMobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

  isMobileNavOpen: false,
  setMobileNavOpen: (open) => set({ isMobileNavOpen: open }),
}));
