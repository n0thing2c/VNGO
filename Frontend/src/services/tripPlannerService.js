import api from "@/lib/axios";
import { toast } from "sonner";

export const tripPlannerService = {
    /**
     * Generate a new trip plan
     * POST /api/recommendation/trip-plan/
     */
    generateTripPlan: async ({
        province,
        numDays,
        budget,
        numPeople = 1,
        placeIds = [],
        preferredTags = [],
        startDate = null,
        maxHoursPerDay = 10,
    }) => {
        try {
            if (!province || !numDays || !budget) {
                toast.error("Please fill in all required fields");
                return { success: false };
            }

            const res = await api.post("/api/recommendation/trip-plan/", {
                province,
                num_days: numDays,
                budget,
                num_people: numPeople,
                place_ids: placeIds,
                preferred_tags: preferredTags,
                start_date: startDate,
                max_hours_per_day: maxHoursPerDay,
            });

            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error generating trip plan:", err);

            if (err.response?.status === 404) {
                toast.error("No tours found in this location", {
                    description: "Try a different province or city",
                });
            } else if (err.response?.data) {
                toast.error("Failed to generate trip plan", {
                    description: err.response.data.error || "Unknown error",
                });
            } else {
                toast.error("Unable to connect to the server");
            }

            return { success: false, error: err };
        }
    },

    /**
     * Save a generated trip plan
     * POST /api/recommendation/trip-plan/save/
     */
    saveTripPlan: async (name, planData) => {
        try {
            const res = await api.post("/api/recommendation/trip-plan/save/", {
                name,
                plan_data: planData,
            });

            toast.success("Trip plan saved successfully!");
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error saving trip plan:", err);
            toast.error("Failed to save trip plan");
            return { success: false, error: err };
        }
    },

    /**
     * Get user's saved trip plans
     * GET /api/recommendation/trip-plans/
     */
    getMyTripPlans: async () => {
        try {
            const res = await api.get("/api/recommendation/trip-plans/");
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching trip plans:", err);
            return { success: false, error: err };
        }
    },

    /**
     * Get a specific trip plan
     * GET /api/recommendation/trip-plans/{id}/
     */
    getTripPlan: async (planId) => {
        try {
            const res = await api.get(`/api/recommendation/trip-plans/${planId}/`);
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching trip plan:", err);
            return { success: false, error: err };
        }
    },

    /**
     * Delete a trip plan
     * DELETE /api/recommendation/trip-plans/{id}/
     */
    deleteTripPlan: async (planId) => {
        try {
            await api.delete(`/api/recommendation/trip-plans/${planId}/`);
            toast.success("Trip plan deleted");
            return { success: true };
        } catch (err) {
            console.error("Error deleting trip plan:", err);
            toast.error("Failed to delete trip plan");
            return { success: false, error: err };
        }
    },

    /**
     * Modify a trip plan (add/remove/swap tours)
     * POST /api/recommendation/trip-plans/{id}/modify/
     */
    modifyTripPlan: async (planId, { action, dayNumber, tourId, newTourId }) => {
        try {
            const res = await api.post(`/api/recommendation/trip-plans/${planId}/modify/`, {
                action,
                day_number: dayNumber,
                tour_id: tourId,
                new_tour_id: newTourId,
            });

            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error modifying trip plan:", err);
            toast.error("Failed to modify trip plan");
            return { success: false, error: err };
        }
    },

    /**
     * Get alternative tours for a day
     * GET /api/recommendation/trip-plans/{id}/alternatives/?day=1
     */
    getAlternatives: async (planId, dayNumber) => {
        try {
            const res = await api.get(
                `/api/recommendation/trip-plans/${planId}/alternatives/?day=${dayNumber}`
            );
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching alternatives:", err);
            return { success: false, error: err };
        }
    },

    /**
     * Generate share link for a trip plan
     * POST /api/recommendation/trip-plans/{id}/share/
     */
    shareTripPlan: async (planId) => {
        try {
            const res = await api.post(`/api/recommendation/trip-plans/${planId}/share/`);
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error sharing trip plan:", err);
            toast.error("Failed to generate share link");
            return { success: false, error: err };
        }
    },

    /**
     * Get a shared trip plan (public)
     * GET /api/recommendation/trip-plan/shared/{token}/
     */
    getSharedTripPlan: async (shareToken) => {
        try {
            const res = await api.get(`/api/recommendation/trip-plan/shared/${shareToken}/`);
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching shared trip plan:", err);
            return { success: false, error: err };
        }
    },

    /**
     * Get personalized tour recommendations
     * POST /api/recommendation/tours/
     */
    getRecommendations: async ({
        province = null,
        tags = [],
        priceMin = null,
        priceMax = null,
        durationMin = null,
        durationMax = null,
        minRating = null,
        limit = 10,
        excludeIds = [],
    }) => {
        try {
            const res = await api.post("/api/recommendation/tours/", {
                province,
                tags,
                price_min: priceMin,
                price_max: priceMax,
                duration_min: durationMin,
                duration_max: durationMax,
                min_rating: minRating,
                limit,
                exclude_ids: excludeIds,
            });

            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching recommendations:", err);
            return { success: false, error: err };
        }
    },

    /**
     * Get similar tours
     * GET /api/recommendation/tours/{id}/similar/
     */
    getSimilarTours: async (tourId, limit = 5) => {
        try {
            const res = await api.get(
                `/api/recommendation/tours/${tourId}/similar/?limit=${limit}`
            );
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching similar tours:", err);
            return { success: false, error: err };
        }
    },

    /**
     * Track tour view
     * POST /api/recommendation/tours/{id}/view/
     */
    trackTourView: async (tourId, duration = 0) => {
        try {
            await api.post(`/api/recommendation/tours/${tourId}/view/`, {
                duration,
            });
            return { success: true };
        } catch (err) {
            // Silently fail - view tracking shouldn't interrupt UX
            console.log("View tracking failed:", err);
            return { success: false };
        }
    },

    /**
     * Get user preferences
     * GET /api/recommendation/preferences/
     */
    getPreferences: async () => {
        try {
            const res = await api.get("/api/recommendation/preferences/");
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching preferences:", err);
            return { success: false, error: err };
        }
    },

    /**
     * Update user preferences
     * POST /api/recommendation/preferences/
     */
    updatePreferences: async (preferences) => {
        try {
            const res = await api.post("/api/recommendation/preferences/", preferences);
            toast.success("Preferences updated!");
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error updating preferences:", err);
            toast.error("Failed to update preferences");
            return { success: false, error: err };
        }
    },

    /**
     * Rebuild user profile from history
     * POST /api/recommendation/preferences/rebuild/
     */
    rebuildProfile: async () => {
        try {
            const res = await api.post("/api/recommendation/preferences/rebuild/");
            toast.success("Profile rebuilt successfully!");
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error rebuilding profile:", err);
            return { success: false, error: err };
        }
    },
};

