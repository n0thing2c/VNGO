import api from "@/lib/axios";
import {toast} from "sonner";

// You can export multiple tour-related API functions here
export const tourService = {
    createTour: async ({
                           tourname,
                           hour,
                           minpeople,
                           maxpeople,
                           transportation,
                           meeting,
                           addedStops,
                           imageData,
                           selectedTags,
                           price,
                           description,
                       }) => {
        try {
            if (
                !tourname ||
                !hour ||
                !minpeople ||
                !maxpeople ||
                !transportation ||
                !price ||
                !meeting ||
                !addedStops?.length ||
                !imageData
            ) {
                toast.error("Please fill in all information!");
                return {success: false};
            }

            const formData = new FormData();
            formData.append("name", tourname);
            formData.append("duration", hour);
            formData.append("min_people", minpeople);
            formData.append("max_people", maxpeople);
            formData.append("transportation", transportation);
            formData.append("meeting_location", meeting);
            formData.append("price", price);
            formData.append("places", JSON.stringify(addedStops));
            formData.append("tags", JSON.stringify(selectedTags));
            formData.append("description", description || "No description");
            formData.append("thumbnail_idx", imageData.thumbnailIdx ?? 0);

            // Append images
            imageData.images.forEach((img) => {
                if (img?.file) formData.append("images", img.file); // "images" must match Django field
            });

            // ✅ Use axios helper
            const res = await api.post("/api/tour/post/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data", // optional, axios can detect automatically
                },
            });

            toast.success("Tour created successfully!");
            return {success: true, data: res.data};
        } catch (err) {
            console.error("Error creating tour:", err);

            if (err.response?.data) {
                toast.error("Failed to create tour", {
                    description: err.response.data.detail || err.response.data.error || "Unknown error",
                });
            } else {
                toast.error("Unable to connect to the server.", {
                    description: "Check your Django logs.",
                });
            }

            return {success: false, error: err};
        }
    },
    updateTour: async ({
                           tour_id,
                           tourname,
                           hour,
                           minpeople,
                           maxpeople,
                           transportation,
                           meeting,
                           addedStops,
                           imageData,
                           removedImageUrls = [],
                           selectedTags = [],
                           price,
                           description,
                       }) => {
        try {
            // Validate required fields
            if (
                !tourname ||
                !hour ||
                !minpeople ||
                !maxpeople ||
                !transportation ||
                !price ||
                !meeting ||
                !addedStops?.length ||
                imageData.images.length === 0
            ) {
                toast.error("Please fill in all required fields!");
                return {success: false};
            }

            // Prepare FormData
            const formData = new FormData();
            formData.append("name", tourname);
            formData.append("duration", Number(hour));
            formData.append("min_people", Number(minpeople));
            formData.append("max_people", Number(maxpeople));
            formData.append("transportation", transportation);
            formData.append("meeting_location", meeting);
            formData.append("price", Number(price));
            formData.append("places", JSON.stringify(addedStops));
            formData.append("tags", JSON.stringify(selectedTags));
            formData.append("description", description || "");

            // Append new image files
            const newImageFiles = [];
            imageData.images.forEach((img) => {
                if (img.file) {
                    newImageFiles.push(img.file);
                    formData.append("images", img.file); // 'images' key for new uploads
                }
            });

            // Append removed image URLs
            formData.append("removed_images", JSON.stringify(removedImageUrls));

            // Handle thumbnail
            let thumbnailData = {type: null, value: null};
            if (imageData.thumbnailIdx >= 0 && imageData.images[imageData.thumbnailIdx]) {
                const thumbnailImage = imageData.images[imageData.thumbnailIdx];
                if (thumbnailImage.file) {
                    const newFileIndex = newImageFiles.findIndex((f) => f === thumbnailImage.file);
                    thumbnailData = {type: "new", index: newFileIndex};
                } else if (thumbnailImage.url) {
                    thumbnailData = {type: "old", url: thumbnailImage.url};
                }
            }
            formData.append("thumbnail_data", JSON.stringify(thumbnailData));

            // Axios PUT request (auto token + refresh)
            const res = await api.put(`/api/tour/put/${tour_id}/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data", // optional
                },
            });

            toast.success("Tour updated successfully!");
            return {success: true, data: res.data};
        } catch (err) {
            console.error("Error updating tour:", err);

            if (err.response?.data) {
                toast.error("Failed to update tour", {
                    description: err.response.data.detail || err.response.data.error || "Unknown error",
                });
            } else {
                toast.error("Unable to connect to the server.", {
                    description: "Check your backend logs.",
                });
            }

            return {success: false, error: err};
        }
    },
    getTour: async (tour_id) => {
        try {
            const res = await api.get(`/api/tour/get/${tour_id}/`);
            return {success: true, data: res.data};
        } catch (err) {
            console.error("Error fetching tour:", err);

            if (err.response?.data) {
                toast.error("Failed to load tour", {
                    description: err.response.data.detail || err.response.data.error || "Unknown error",
                });
            } else {
                toast.error("Unable to connect to the server.", {
                    description: "Check your backend logs.",
                });
            }

            return {success: false, error: err};
        }
    },
    submitRating: async ({ tourId, rating, review, reviewTags = [], images = [] }) => {
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

      const res = await api.post(`/api/tour/rate/${tourId}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Axios sets this automatically with FormData, but explicit is fine
        },
      });

      toast.success("Rating submitted successfully!");
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Error submitting rating:", err);

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
    getRatings: async (tourId) => {
    try {
      const res = await api.get(`/api/tour/ratings/${tourId}/`);
      return { success: true, data: res.data };
    } catch (err) {
      console.error("Error fetching ratings:", err);

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
};
