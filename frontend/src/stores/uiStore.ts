import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'dark',

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => {
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(theme);
        set({ theme });
      },
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.remove('dark', 'light');
          document.documentElement.classList.add(next);
          return { theme: next };
        }),
    }),
    {
      name: 'taskify-ui',
      onRehydrateStorage: () => (state) => {
        const theme = state?.theme ?? 'dark';
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(theme);
      },
    },
  ),
);
