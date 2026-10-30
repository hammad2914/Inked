import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  /** desktop sidebar: full width or folded to icons (remembered) */
  sidebarOpen: boolean;
  /** phone drawer: closes on every page change */
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      mobileNavOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
    }),
    { name: 'inked-ui', partialize: (s) => ({ sidebarOpen: s.sidebarOpen }) },
  ),
);
