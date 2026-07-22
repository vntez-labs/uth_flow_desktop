import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "../interfaces/profile";

interface UserStore {
  user: Profile | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: Profile) => void;
  clearAuth: () => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      isLoading: false,
      setAuth: (token, user) => set({ token, user, isLoggedIn: true }),
      clearAuth: () => set({ token: null, user: null, isLoggedIn: false }),
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, token: state.token, isLoggedIn: state.isLoggedIn }),
    }
  )
);
