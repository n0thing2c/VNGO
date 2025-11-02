import api from "@/lib/axios";

export const authService = {
    signUp: async (username, email, password, role) => {
        const response = await api.post(
            "/auth/signup/",
            { username, email, password, role }
        );

        return response.data;
    },
    verifyEmail: async (token) => {
        const response = await api.post(
            "/auth/email/confirm/",
            { token }
        );

        return response.data;
    }
}

