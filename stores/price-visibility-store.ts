import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PriceVisibilityState {
  pricesHidden: boolean;
  togglePricesHidden: () => void;
  setPricesHidden: (hidden: boolean) => void;
}

export const usePriceVisibilityStore = create<PriceVisibilityState>()(
  persist(
    (set) => ({
      pricesHidden: false,
      togglePricesHidden: () =>
        set((state) => ({ pricesHidden: !state.pricesHidden })),
      setPricesHidden: (pricesHidden) => set({ pricesHidden }),
    }),
    {
      name: 'pawn-tracker-price-visibility',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
