import api from "@/lib/axios";
import { toast } from "sonner";

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
    submitGuideRating: async ({ guideId, rating, review, reviewTags = [], images = [] }) => {
        if (!rating) {
            toast.error("Please select a rating.");
            return { success: false };
        }

        try {
            const formData = new FormData();
            formData.append("rating", rating);
            formData.append("review", review);
            formData.append("review_tags", JSON.stringify(reviewTags));
            images.forEach((img) => formData.append("images", img.file || img));

            const res = await api.post(`/profiles/guide/rate/${guideId}/`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Rating submitted successfully!");
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error submitting profile rating:", err);

            if (err.response?.data) {
                toast.error("Failed to submit rating", {
                    description: err.response.data.detail || err.response.data.error || "Unknown error",
                });
            } else {
                toast.error("Unable to connect to the server.");
            }

            return { success: false, error: err };
        }
    },

    getGuideRatings: async (guideId) => {
        try {
            const res = await api.get(`/profiles/guide/ratings/${guideId}/`);
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching profile ratings:", err);

            if (err.response?.data) {
                toast.error("Failed to load ratings", {
                    description: err.response.data.detail || err.response.data.error || "Unknown error",
                });
            } else {
                toast.error("Unable to connect to the server.");
            }

            return { success: false, error: err };
        }
    },

    getGuidePublicProfile: async (guideId) => {
        if (!guideId) {
            return { success: false, error: new Error("Guide ID is required") };
        }

        try {
            const res = await api.get(`/profiles/guide/public/${guideId}/`);
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching public guide profile:", err);
            if (err.response?.data) {
                toast.error("Failed to load guide profile", {
                    description: err.response.data.detail || err.response.data.error || "Unknown error",
                });
            } else {
                toast.error("Unable to connect to the server.");
            }
            return { success: false, error: err };
        }
    },
    getGuideAchievements: async (guideId) => {
        if (!guideId) {
            return { success: false, error: new Error("Guide ID is required") };
        }

        try {
            const res = await api.get(`/profiles/guide/achievements/${guideId}/`);
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching guide achievements:", err);
            if (err.response?.data) {
                toast.error("Failed to load guide achievements", {
                    description: err.response.data.detail || err.response.data.error || "Unknown error",
                });
            } else {
                toast.error("Unable to connect to the server.");
            }
            return { success: false, error: err };
        }
    },
};


