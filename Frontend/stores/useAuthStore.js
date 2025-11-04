import { create } from "zustand";
import { authService } from "../src/services/authService";

export const useAuthStore = create((set, get) => ({
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
}));
