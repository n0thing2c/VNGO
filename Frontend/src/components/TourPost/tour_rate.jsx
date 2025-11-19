"use client";

import React, {useState} from "react";
import axios from "axios";
import ImageUploader, {ImageDropBox} from "../imageuploader.jsx";
import {Rating, RatingButton} from "@/components/ui/shadcn-io/rating/index.jsx";
import {Button} from "@/components/ui/button.jsx";
import {Textarea} from "@/components/ui/textarea.jsx";
import TagSelector from "@/components/tagsselector.jsx";
import {useAuthStore} from "@/stores/useAuthStore.js";
import {tourService} from "@/services/tourService.js";

export default function TourRate({tourId, onRated}) {
    const accessToken = useAuthStore((state) => state.accessToken);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");
    const [reviewTags, setReviewTags] = useState([]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Predefined tags
    const predefinedTags = [
        // Positive
        "Friendly Guide", "Great Value", "Family Friendly", "Adventure", "Scenic",
        "Luxury Experience", "Well Organized", "Fun Activities", "Comfortable Transport", "Excellent Food",

        // Negative
        "Overpriced", "Crowded", "Poor Organization", "Limited Time", "Unfriendly Staff",
        "Boring", "Uncomfortable Transport", "Long Waiting Times", "Low Quality Food", "Not Worth It"
    ];
    const TOUR_RATING_TAG_VARIANTS = {
        // Positive Tags
        "Friendly Guide": "brightgreen",
        "Great Value": "lime",
        "Family Friendly": "mint",
        "Adventure": "aqua",
        "Scenic": "bluelavender",
        "Luxury Experience": "violet",
        "Well Organized": "sky",
        "Fun Activities": "orange",
        "Comfortable Transport": "teal",
        "Excellent Food": "coral",

        // Negative Tags
        "Overpriced": "mustard",
        "Crowded": "plum",
        "Poor Organization": "olive",
        "Limited Time": "sand",
        "Unfriendly Staff": "plum",
        "Boring": "sand",
        "Uncomfortable Transport": "olive",
        "Long Waiting Times": "mustard",
        "Low Quality Food": "peach",
        "Not Worth It": "coral",
    };


    const handleImagesChange = (imgs) => {
        setImages(imgs);
    };

    const handleSubmit = async () => {
        const result = await tourService.submitRating({
            tourId,
            rating,
            review,
            reviewTags,
            images,
        });

        if (result.success) {
            setRating(0);
            setReview("");
            setReviewTags([]);
            setImages([]);
            if (onRated) onRated(result.data);
        }
    };

    return (
        <div
            className="w-full max-w-2xl mx-auto p-1 bg-transparent transition-all">
            <h3 className="text-lg sm:text-xl md:text-2xl mb-4 text-center sm:text-left">
                Rate this tour
            </h3>

            {/* Star Rating */}
            <div className="flex justify-center sm:justify-start mb-4">
                <Rating value={rating} onValueChange={setRating}>
                    {[...Array(5)].map((_, idx) => (
                        <RatingButton key={idx} size={20} className="text-yellow-500"/>
                    ))}
                </Rating>
            </div>

            {/* Review */}
            <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write your review..."
                className="mb-5 bg-transparent"
            />

            {/* Predefined Tags */}
            <div className="mb-4">
                <TagSelector
                    tags={predefinedTags}
                    selectedTags={reviewTags}
                    setSelectedTags={setReviewTags}
                    tagVariants={TOUR_RATING_TAG_VARIANTS}
                />
            </div>

            {/* Image Uploader */}
            <div className="mb-4">
                {/*<ImageUploader*/}
                {/*    images={images}*/}
                {/*    onImagesChange={handleImagesChange}*/}
                {/*    allowThumbnail={false}*/}
                {/*/>*/}
                <ImageDropBox
                    images={images}
                    onImagesChange={handleImagesChange}
                />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full sm:w-auto bg-black text-white hover:bg-white hover:border-1 hover:border-black hover:text-black py-2 sm:py-3 px-6 rounded-xl transition"
                >
                    {loading ? "Submitting..." : "Submit Rating"}
                </Button>
            </div>


            {success && (
                <p className="text-green-600 mt-3 text-sm sm:text-base">{success}</p>
            )}
            {error && (
                <p className="text-red-600 mt-3 text-sm sm:text-base">{error}</p>
            )}
        </div>
    );

}
