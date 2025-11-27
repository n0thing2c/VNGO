import React, { useState } from "react";
import { Card } from "@/components/ui/card.jsx";
import { FieldLabel } from "@/components/ui/field.jsx";
import { Star } from "lucide-react";
import AlbumPhotoFrame from "@/components/albumframes.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination.jsx";
import { TOUR_TAG_VARIANTS, GUIDE_TAG_VARIANTS } from "@/components/rating/tag_variants.js";

const RatingList = ({ ratings = [], type = "tour" }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ratingsPerPage = 2;
  const [expandedReviews, setExpandedReviews] = useState({});

  if (!ratings.length)
    return <p className="text-center text-gray-500">No ratings yet.</p>;

  const totalPages = Math.ceil(ratings.length / ratingsPerPage);
  const paginatedRatings = ratings.slice(
    (currentPage - 1) * ratingsPerPage,
    currentPage * ratingsPerPage
  );

  const toggleReadMore = (idx) => {
    setExpandedReviews((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Pick correct tag variants based on type
  const TAG_VARIANTS = type === "tour" ? TOUR_TAG_VARIANTS : GUIDE_TAG_VARIANTS;

  return (
    <div className="flex flex-col space-y-4">
      {paginatedRatings.map((rating, idx) => (
        <div key={idx} className="bg-transparent p-4 flex flex-col gap-4 border-0">
          {/* Top Row: Avatar + Name + Stars */}
          <div className="flex flex-row gap-4 items-start">
            <div className="flex-shrink-0 w-16">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gray-300 flex items-center justify-center font-bold overflow-hidden">
                {rating.tourist?.avatar ? (
                  <img
                    src={rating.tourist.avatar}
                    alt={rating.tourist.username || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-lg">
                    {rating.tourist?.username
                      ? rating.tourist.username[0].toUpperCase()
                      : "A"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center gap-1">
              <FieldLabel className="text-base font-semibold">
                {rating.tourist?.username || "Anonymous"}
              </FieldLabel>
              {rating.tour?.name && (
                <span className="text-xs text-gray-500">
                  Tour: {rating.tour.name}
                </span>
              )}

              <div className="flex flex-row space-x-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const isFilled = i < rating.rating;
                  return (
                    <Star
                      key={i}
                      className="w-5 h-5"
                      fill={isFilled ? "#facc15" : "#d1d5db"}
                      stroke={isFilled ? "#facc15" : "#d1d5db"}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Review Text */}
          {rating.review && (
            <div className="text-gray-700 text-sm sm:text-base">
              <p className={`${expandedReviews[idx] ? "" : "line-clamp-3"} break-words`}>
                {rating.review}
              </p>
              {rating.review.length > 150 && (
                <button
                  className="text-[#139d7a] text-sm mt-1 font-semibold"
                  onClick={() => toggleReadMore(idx)}
                >
                  {expandedReviews[idx] ? "Read Less" : "Read More"}
                </button>
              )}
            </div>
          )}

          {/* Images */}
          {rating.images && rating.images.length > 0 && <AlbumPhotoFrame images={rating.images} />}

          {/* Tags */}
          {rating.review_tags && rating.review_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {rating.review_tags.map((tag, i) => (
                <Badge key={i} variant={TAG_VARIANTS[tag] || "default"}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(i + 1);
                  }}
                  className={currentPage === i + 1 ? "bg-gray-800 text-white" : "text-black"}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            {totalPages > 5 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default RatingList;
