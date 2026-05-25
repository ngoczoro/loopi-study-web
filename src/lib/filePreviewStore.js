import { create } from "zustand";

export const useFilePreviewStore = create((set) => ({
  item: null,
  isOpen: false,
  openPreview: (item) => set({ item, isOpen: true }),
  closePreview: () => set({ item: null, isOpen: false }),
}));
