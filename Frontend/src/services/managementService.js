import api from "@/lib/axios";
import { toast } from "sonner";

/**
 * Helper function to format error messages in a user-friendly way
 * Returns only the error messages without field name prefixes
 */
const formatErrorMessage = (errorData) => {
    let errorDescription = "";

    // Check for field-specific errors
    if (typeof errorData === 'object' && !errorData.error && !errorData.detail && !errorData.message) {
        // Django REST Framework validation errors
        const errors = [];
        for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
                errors.push(messages.join(', '));
            } else {
                errors.push(messages);
            }
        }
        errorDescription = errors.join('\n');
    } else {
        errorDescription = errorData.error || errorData.detail || errorData.message || "Unknown error";
    }

    return errorDescription;
};

export const managementService = {
    /**
     * Get management snapshot data (bookings, incoming requests, past tours)
     * GET /management/frontend/snapshot/
     * Returns data based on user role (tourist or guide)
     */
    getManagementSnapshot: async () => {
        try {
            const res = await api.get("/management/frontend/snapshot/");
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching management snapshot:", err);

            if (err.response?.data) {
                const errorDescription = formatErrorMessage(err.response.data);
                toast.error("Failed to load management data", {
                    description: errorDescription,
                });
            } else {
                toast.error("Unable to connect to the server.");
            }

            return { success: false, error: err };
        }
    },

    /**
     * Create a new booking (Tourist only)
     * POST /management/bookings/
     */
    createBooking: async ({ tour, number_of_guests, tour_date, tour_time, special_requests = "" }) => {
        try {
            if (!tour || !number_of_guests || !tour_date || !tour_time) {
                toast.error("Please fill in all required fields!");
                return { success: false };
            }

            const bookingData = {
                tour,
                number_of_guests,
                tour_date,
                tour_time,
                special_requests,
            };

            console.log("Sending booking data:", bookingData);

            const res = await api.post("/management/bookings/", bookingData);

            toast.success("Booking request sent successfully!");
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error creating booking:", err);
            console.error("Error response:", err.response?.data);

            if (err.response?.data) {
                const errorDescription = formatErrorMessage(err.response.data);
                toast.error("Failed to create booking", {
                    description: errorDescription,
                });
            } else {
                toast.error("Unable to connect to the server.");
            }

            return { success: false, error: err };
        }
    },

    /**
     * Get booking details
     * GET /management/bookings/{id}/
     */
    getBookingDetails: async (bookingId) => {
        try {
            const res = await api.get(`/management/bookings/${bookingId}/`);
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching booking details:", err);

            if (err.response?.data) {
                const errorDescription = formatErrorMessage(err.response.data);
                toast.error("Failed to load booking details", {
                    description: errorDescription,
                });
            } else {
                toast.error("Unable to connect to the server.");
            }

            return { success: false, error: err };
        }
    },

    /**
     * Respond to a booking request (Guide only)
     * POST /management/bookings/{id}/respond/
     */
    respondToBooking: async (bookingId, action, decline_reason = "") => {
        try {
            if (!["accept", "decline"].includes(action)) {
                toast.error("Invalid action!");
                return { success: false };
            }

            if (action === "decline" && !decline_reason) {
                toast.error("Please provide a reason for declining.");
                return { success: false };
            }

            const res = await api.post(`/management/bookings/${bookingId}/respond/`, {
                action,
                decline_reason,
            });

            toast.success(
                action === "accept" ? "Booking accepted successfully!" : "Booking declined."
            );
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error responding to booking:", err);

            if (err.response?.data) {
                const errorDescription = formatErrorMessage(err.response.data);
                toast.error("Failed to respond to booking", {
                    description: errorDescription,
                });
            } else {
                toast.error("Unable to connect to the server.");
            }

            return { success: false, error: err };
        }
    },

    /**
     * Update booking
     * PUT /management/bookings/{id}/
     */
    updateBooking: async (bookingId, updateData) => {
        try {
            const res = await api.put(`/management/bookings/${bookingId}/`, updateData);
            toast.success("Booking updated successfully!");
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error updating booking:", err);

            if (err.response?.data) {
                const errorDescription = formatErrorMessage(err.response.data);
                toast.error("Failed to update booking", {
                    description: errorDescription,
                });
            } else {
                toast.error("Unable to connect to the server.");
            }

            return { success: false, error: err };
        }
    },

    /**
     * Delete booking
     * DELETE /management/bookings/{id}/
     */
    deleteBooking: async (bookingId) => {
        try {
            await api.delete(`/management/bookings/${bookingId}/`);
            toast.success("Booking deleted successfully!");
            return { success: true };
        } catch (err) {
            console.error("Error deleting booking:", err);

            if (err.response?.data) {
                const errorDescription = formatErrorMessage(err.response.data);
                toast.error("Failed to delete booking", {
                    description: errorDescription,
                });
            } else {
                toast.error("Unable to connect to the server.");
            }

            return { success: false, error: err };
        }
    },

    /**
     * Get notifications
     * GET /management/notifications/
     */
    getNotifications: async (unread = false) => {
        try {
            const params = unread ? { unread: true } : {};
            const res = await api.get("/management/notifications/", { params });
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error fetching notifications:", err);

            if (err.response?.data) {
                const errorDescription = formatErrorMessage(err.response.data);
                toast.error("Failed to load notifications", {
                    description: errorDescription,
                });
            } else {
                toast.error("Unable to connect to the server.");
            }

            return { success: false, error: err };
        }
    },

    /**
     * Mark notification as read
     * POST /management/notifications/{id}/read/
     */
    markNotificationRead: async (notificationId) => {
        try {
            const res = await api.post(`/management/notifications/${notificationId}/read/`);
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error marking notification as read:", err);
            return { success: false, error: err };
        }
    },

    /**
     * Mark all notifications as read
     * POST /management/notifications/read-all/
     */
    markAllNotificationsRead: async () => {
        try {
            const res = await api.post("/management/notifications/read-all/");
            toast.success("All notifications marked as read!");
            return { success: true, data: res.data };
        } catch (err) {
            console.error("Error marking all notifications as read:", err);

            if (err.response?.data) {
                const errorDescription = formatErrorMessage(err.response.data);
                toast.error("Failed to mark notifications as read", {
                    description: errorDescription,
                });
            } else {
                toast.error("Unable to connect to the server.");
            }

            return { success: false, error: err };
        }
    },
};

