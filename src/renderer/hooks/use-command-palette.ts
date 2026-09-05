import { create } from 'zustand';

interface CommandPaletteStore {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

/**
 * Global, not route-scoped: the palette is meant to work from anywhere in the app, and a hotkey
 * listener living outside any one page's component tree needs a store it can reach imperatively.
 */
export const useCommandPaletteStore = create<CommandPaletteStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open })),
}));
