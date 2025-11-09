import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../src/services/authService";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,

      // Align params and order with authService: (username, email, password, role)
      signUp: async (username, email, password, role) => {
        try {
          set({ loading: true });
          await authService.signUp(username, email, password, role);
        } catch (error) {
          // Re-throw so UI can handle toast/navigation consistently
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      login: async (username, password) => {
        try {
          set({ loading: true });
          const data = await authService.login(username, password); // { access }
          set({ accessToken: data.access });
          const me = await authService.me();
          set({ user: me });
          return me;
        } catch (error) {
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      logout: async () => {
        set({ accessToken: null, user: null });
        await authService.logout();
      },
    }),
    {
      name: "auth",
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    }
  )
);
