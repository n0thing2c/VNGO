import api from "@/lib/axios";

export const profileService = {
    getMyProfile: async () => {
        const response = await api.get("/profiles/me/");
        return response.data;
    },
    updateMyProfile: async (payload) => {
        const response = await api.patch("/profiles/me/", payload);
        return response.data;
    },
    uploadProfileImage: async (file) => {
        const formData = new FormData();
        formData.append("image", file);
        const response = await api.post("/profiles/upload-avatar/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },
};


