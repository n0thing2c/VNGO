"use client";

import React, { useState } from "react";
import { Rating, RatingButton } from "@/components/ui/shadcn-io/rating/index.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import TagSelector from "@/components/tagsselector.jsx";
import ImageUploader, { ImageDropBox } from "../imageuploader.jsx";
import { tourService } from "@/services/tourService.js";
import { profileService } from "@/services/profileService.js";
import { TOUR_TAG_VARIANTS, GUIDE_TAG_VARIANTS } from "@/components/rating/tag_variants.js";

export default function Rate({ id, type = "tour", onRated }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [reviewTags, setReviewTags] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const predefinedTags = type === "tour"
    ? Object.keys(TOUR_TAG_VARIANTS)
    : Object.keys(GUIDE_TAG_VARIANTS);

  const tagVariants = type === "tour" ? TOUR_TAG_VARIANTS : GUIDE_TAG_VARIANTS;

  const handleImagesChange = (imgs) => {
    setImages(imgs.slice(0, 10)); // limit to 10 images
  };

  const handleSubmit = async () => {
    if (!rating) return;

    setLoading(true);
    try {
      const payload = { rating, review, reviewTags, images };

      const result = type === "tour"
        ? await tourService.submitRating({ tourId: id, ...payload })
        : await profileService.submitGuideRating({ guideId: id, ...payload });

      if (result?.success) {
        setRating(0);
        setReview("");
        setReviewTags([]);
        setImages([]);
        onRated?.(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[90vw] sm:max-w-2xl mx-auto p-4 bg-transparent relative">
      <h3 className="text-lg sm:text-xl md:text-2xl mb-4 text-center sm:text-left">
        {type === "tour" ? "Rate this tour" : "Rate this guide"}
      </h3>

      {/* Star Rating */}
      <div className="flex justify-center sm:justify-start mb-4">
        <Rating value={rating} onValueChange={setRating}>
          {[...Array(5)].map((_, idx) => (
            <RatingButton key={idx} size={20} className="text-yellow-500" />
          ))}
        </Rating>
      </div>

      {/* Review */}
      <div className="relative mb-5 w-full">
        <Textarea
          placeholder={`Enter a short description of your ${type}`}
          value={review}
          onChange={(e) => setReview(e.target.value.slice(0, 1000))}
          rows={5}
          maxLength={1000}
          className="w-full bg-transparent break-words whitespace-normal resize-none"
        />
        <span className="absolute bottom-1 right-2 text-xs xl:text-sm text-gray-400 select-none">
          {review.length}/1000
        </span>
      </div>

      {/* Tags */}
      <div className="mb-4 w-full overflow-x-auto">
        <TagSelector
          tags={predefinedTags}
          selectedTags={reviewTags}
          setSelectedTags={setReviewTags}
          tagVariants={tagVariants}
        />
      </div>

      {/* Image DropBox */}
      <div className="mb-4 w-full">
        <ImageDropBox images={images} onImagesChange={handleImagesChange} />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end w-full">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full sm:w-auto bg-black text-white hover:bg-white hover:border-1 hover:border-black hover:text-black py-2 sm:py-3 px-6 rounded-xl transition"
        >
          {loading ? "Submitting..." : "Submit Rating"}
        </Button>
      </div>
    </div>
  );
}
