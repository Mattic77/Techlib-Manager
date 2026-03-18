import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  isEcoMode: boolean;
  toggleEcoMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isEcoMode: false,
      toggleEcoMode: () => set((state) => ({ isEcoMode: !state.isEcoMode })),
    }),
    {
      name: 'settings-storage',
    }
  )
);
