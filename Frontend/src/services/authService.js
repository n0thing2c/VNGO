import api from "@/lib/axios";

export const authService = {
    login: async (username, password) => {
        const response = await api.post(
            "/auth/login/",
            { username, password }
        );
        return response.data; // { access }
    },
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
    },
    resendVerificationEmail: async (email) => {
        const response = await api.post(
            "/auth/email/resend/",
            { email }
        );

        return response.data;
    },
    me: async () => {
        const response = await api.get("/auth/me/");
        return response.data;
    },
    forgetPassword: async (email) => {
        const response = await api.post(
            "/auth/password/forget/",
            { email }
        );
        return response.data;
    },
    resetPassword: async (token, newPassword) => {
        const response = await api.post(
            "/auth/password/reset/",
            { token, new_password: newPassword }
        );
        return response.data;
    },
    logout: async () => {
        const response = await api.post("/auth/logout/", {});
        return response.data;
    }
}

