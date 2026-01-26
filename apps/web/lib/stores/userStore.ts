"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CompleteUserObject, User, UserWallet, UserStats } from "../types/user";

interface UserState {
  // Persisted to localStorage (profile data that rarely changes)
  user: User | null;
  lastFetched: number | null;

  // Not persisted - kept in memory only (changes frequently after games)
  wallet: UserWallet | null;
  stats: UserStats | null;

  // Actions
  setUserData: (data: CompleteUserObject) => void;
  updateWalletAndStats: (wallet: UserWallet | null, stats: UserStats | null) => void;
  clearUser: () => void;
  isStale: (maxAgeMs?: number) => boolean;
}

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      wallet: null,
      stats: null,
      lastFetched: null,

      setUserData: (data: CompleteUserObject) =>
        set({
          user: data.user,
          wallet: data.wallet,
          stats: data.stats,
          lastFetched: Date.now(),
        }),

      updateWalletAndStats: (wallet: UserWallet | null, stats: UserStats | null) =>
        set({ wallet, stats }),

      clearUser: () =>
        set({
          user: null,
          wallet: null,
          stats: null,
          lastFetched: null,
        }),

      isStale: (maxAgeMs = DEFAULT_STALE_TIME) => {
        const { lastFetched } = get();
        if (!lastFetched) return true;
        return Date.now() - lastFetched > maxAgeMs;
      },
    }),
    {
      name: "chess-user-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist user profile and lastFetched - wallet/stats are fetched fresh
      partialize: (state) => ({
        user: state.user,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
