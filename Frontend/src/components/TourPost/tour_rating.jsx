import React, {useState} from "react";
import {Card} from "@/components/ui/card.jsx";
import {FieldLabel} from "@/components/ui/field.jsx";
import {Star} from "lucide-react";
import AlbumPhotoFrame from "@/components/albumframes.jsx";
import {Badge} from "@/components/ui/badge.jsx";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination.jsx";

const TOUR_RATING_TAG_VARIANTS = {
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

const TourRating = ({ratings = []}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ratingsPerPage = 2;

    if (!ratings.length)
        return <p className="text-center text-gray-500">No ratings yet.</p>;

    const totalPages = Math.ceil(ratings.length / ratingsPerPage);
    const paginatedRatings = ratings.slice(
        (currentPage - 1) * ratingsPerPage,
        currentPage * ratingsPerPage
    );

    return (
        <div className="flex flex-col space-y-4">
            {paginatedRatings.map((rating, idx) => (
                <Card
                    key={idx}
                    className="bg-white shadow-md rounded-xl p-4 flex flex-col sm:flex-row gap-4"
                >
                    {/* Left: User Info */}
                    <div className="flex-shrink-0 w-16 sm:w-20 flex flex-col items-center">
                        <div
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-300 flex items-center justify-center font-bold overflow-hidden">
                            {rating.tourist?.avatar ? (
                                <img
                                    src={rating.tourist.avatar}
                                    alt={rating.tourist.username || "Tourist"}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-white">
                  {rating.tourist?.username
                      ? rating.tourist.username[0].toUpperCase()
                      : "A"}
                </span>
                            )}
                        </div>
                        <FieldLabel className="mt-2 text-sm sm:text-base font-semibold text-center">
                            {rating.tourist?.username || "Anonymous"}
                        </FieldLabel>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex flex-row space-x-1">
                            {Array.from({length: 5}).map((_, i) => {
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

                        {rating.review && (
                            <p className="text-gray-700 text-sm sm:text-base">{rating.review}</p>
                        )}

                        {rating.images && rating.images.length > 0 && (
                            <AlbumPhotoFrame images={rating.images}/>
                        )}

                        {rating.review_tags && rating.review_tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                                {rating.review_tags.map((tag, i) => (
                                    <Badge key={i} variant={TOUR_RATING_TAG_VARIANTS[tag] || "default"}>
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            ))}

            {/* ShadCN Pagination */}
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

                        {Array.from({length: totalPages}).map((_, i) => (
                            <PaginationItem key={i}>
                                <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setCurrentPage(i + 1);
                                    }}
                                    className={
                                        currentPage === i + 1
                                            ? "bg-gray-800 text-white"
                                            : "text-black"
                                    }
                                >
                                    {i + 1}
                                </PaginationLink>

                            </PaginationItem>
                        ))}

                        {totalPages > 5 && <PaginationItem><PaginationEllipsis/></PaginationItem>}

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

export default TourRating;
