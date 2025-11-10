import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Star } from "lucide-react";
import AlbumPhotoFrame from "@/components/albumframes.jsx";
import { Badge } from "@/components/ui/badge"; // import your Badge component

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

const TourRating = ({ ratings = [] }) => {
  if (!ratings.length)
    return <p className="text-center text-gray-500">No ratings yet.</p>;

  return (
    <div className="flex flex-col space-y-4">
      {ratings.map((rating, idx) => (
        <Card
          key={idx}
          className="bg-white shadow-md rounded-xl p-4 flex flex-col sm:flex-row gap-4"
        >
          {/* Left: User Info */}
          <div className="flex-shrink-0 w-16 sm:w-20 flex flex-col items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
              {rating.user ? rating.user[0].toUpperCase() : "A"}
            </div>
            <FieldLabel className="mt-2 text-sm sm:text-base font-semibold text-center">
              {rating.user || "Anonymous"}
            </FieldLabel>
          </div>

          {/* Right: Content */}
          <div className="flex-1 flex flex-col gap-2">
            {/* Stars */}
            <div className="flex flex-row space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 flex-shrink-0 ${
                    i < rating.rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Review Text */}
            {rating.review && (
              <p className="text-gray-700 text-sm sm:text-base">{rating.review}</p>
            )}

            {/* Photos */}
            {rating.images && rating.images.length > 0 && (
              <AlbumPhotoFrame images={rating.images} />
            )}

            {/* Review Tags */}
            {rating.review_tags && rating.review_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {rating.review_tags.map((tag, i) => (
                  <Badge
                    key={i}
                    variant={TOUR_RATING_TAG_VARIANTS[tag] || "default"}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TourRating;
