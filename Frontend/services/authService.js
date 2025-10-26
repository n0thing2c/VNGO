import api from "@/lib/axios";

export const authService = {
    signUp: async (username, password, email) => {
        const response = await api.post(
            "/auth/signup",
            { user, password, email },
            { withCredentials: true }
        );

        return response.data;
    }
}