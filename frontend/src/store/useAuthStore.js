import { create } from "zustand";
import { loginUser, signupUser } from "../api/auth";

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user")) || null, // ✅ LOAD ON START
  loading: false,

  login: async (data) => {
    try {
      set({ loading: true });

      const res = await loginUser(data);

      // ✅ SAVE TO LOCALSTORAGE
      localStorage.setItem("user", JSON.stringify(res.data));

      set({
        user: res.data,
        loading: false,
      });

      return true;
    } catch (err) {
      console.error(err);
      set({ loading: false });
      return false;
    }
  },

  signup: async (data) => {
    try {
      set({ loading: true });

      const res = await signupUser(data);

      // ✅ SAVE TO LOCALSTORAGE
      localStorage.setItem("user", JSON.stringify(res.data));

      set({
        user: res.data,
        loading: false,
      });

      return true;
    } catch (err) {
      console.error(err);
      set({ loading: false });
      return false;
    }
  },

  // ✅ LOGOUT FUNCTION
  logout: () => {
    localStorage.removeItem("user");
    set({ user: null });
  },
}));