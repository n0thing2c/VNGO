import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "../src/services/authService";

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,

  signUp: async (username, password, email) => {
    try {
      set({ loading: true });

      // Call api
      await authService.signUp(username, password, email);

      toast.success(
        "Sign up successfully. You will be redirected to the personal information page."
      );
    } catch (error) {
      console.error(error);
      toast.error("Sign up unsuccesfully");
    } finally {
      set({ loading: false });
    }
  },
}));
