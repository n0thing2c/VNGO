import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Languages, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { profileService } from "@/services/profileService.js";
import RatingList from "@/components/rating/ratings.jsx";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constant.js";
import { FieldLabel, FieldSeparator, FieldDescription } from "@/components/ui/field.jsx";

const DEFAULT_AVATAR = "https://placehold.co/112x112/A0A0A0/ffffff?text=User";

const StarRating = ({ rating = 0 }) => {
    const value = Number(rating) || 0;
    return (
        <div className="flex items-center space-x-0.5">
            {Array.from({ length: 5 }).map((_, idx) => {
                const isFilled = idx + 1 <= Math.round(value);
                return (
                    <Star
                        key={idx}
                        className={`w-4 h-4 ${isFilled ? "text-yellow-400" : "text-gray-300"}`}
                        fill="currentColor"
                    />
                );
            })}
        </div>
    );
};

const PastTourCard = ({ tour, onViewTour }) => (
    <div className="flex flex-col min-w-[240px] w-[240px] h-[280px] bg-white rounded-lg overflow-hidden shadow-md border border-gray-100">
        <img
            src={tour.image}
            alt={tour.title}
            className="h-32 w-full object-cover"
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/240x180/4F68C4/ffffff?text=Tour";
            }}
        />

        <div className="flex flex-col p-3 flex-1">
            <h4 className="font-semibold text-sm truncate">{tour.title}</h4>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {tour.guideName ? `With guide ${tour.guideName}` : "Completed tour"}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                <StarRating rating={tour.rating || 0} />
                <span>{tour.rating ? tour.rating.toFixed(1) : "No rating"}</span>
            </div>

            {/* Button always at bottom */}
            <div className="mt-auto flex justify-start">
                <Button
                    className="px-3 py-1 text-xs rounded-full bg-neutral-900 hover:bg-neutral-800 text-white"
                    onClick={() => onViewTour?.(tour.tourId)}
                >
                    View tour
                </Button>
            </div>
        </div>
    </div>
);

export function TouristPublicProfile({ touristId }) {
    const navigate = useNavigate();
    const [tourist, setTourist] = useState(null); // holds tourist profile
    const [tours, setTours] = useState([]); // past tours
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const tourListRef = useRef(null);

    const normalizeReviews = (data) => {
        return (data || []).map((r) => ({
            ...r,
            review_tags: Array.isArray(r.review_tags) ? r.review_tags : [],
            tourist: r.tourist || { username: "Anonymous", avatar: null },
        }));
    };

    const fetchProfile = useCallback(async () => {
        if (!touristId) {
            setError("Missing tourist id in the URL.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const profileRes = await profileService.getTouristPublicProfile(touristId);

            if (profileRes.success && profileRes.data) {
                const profile = profileRes.data.profile || null;
                const pastTours = profileRes.data.past_tours || [];
                const ratings = profileRes.data.ratings || [];

                setTourist(profile);
                setTours(pastTours);

                const normalized = normalizeReviews(ratings);
                setReviews(normalized);
            } else {
                setTourist(null);
                setTours([]);
                setReviews([]);
            }
        } catch (err) {
            console.error("Failed to load tourist profile:", err);
            setError("Unable to load tourist information. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [touristId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleViewTour = (tourId) => {
        if (!tourId) return;
        navigate(ROUTES.TOUR_POST(tourId));
    };

    const scrollTours = (direction) => {
        if (!tourListRef.current) return;
        const scrollAmount = 260;
        tourListRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    if (loading)
        return <div className="py-16 text-center text-gray-600">Loading profile...</div>;

    if (error || !tourist)
        return (
            <div className="py-16 text-center text-red-500">
                {error || "Tourist not found."}
            </div>
        );

    return (
        <div className="min-h-screen w-full">
            <div className="mx-auto w-full md:max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 pb-12 space-y-8">
                {/* Tourist Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col space-y-3 border-b md:border-b-0 md:border-r border-black md:pr-6 pb-4 md:pb-0">
                        {/* Avatar + Name */}
                        <div className="flex flex-col items-center space-y-2">
                            <div className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-white ring-2 ring-gray-300">
                                <img
                                    src={tourist.face_image || DEFAULT_AVATAR}
                                    alt={tourist.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = DEFAULT_AVATAR;
                                    }}
                                />
                            </div>
                            <FieldLabel className="text-xl font-bold text-gray-900 text-center">
                                {tourist.name}
                            </FieldLabel>
                        </div>

                        {/* Other Info */}
                        <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 mr-1 text-red-600" />
                            <span>{tourist.nationality || "Nationality not provided"}</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                            <Languages className="w-4 h-4 mr-1 text-blue-700" />
                            <span>
                                {tourist.age ? `${tourist.age} years old` : "Age not provided"}
                                {tourist.gender ? ` • ${tourist.gender}` : ""}
                            </span>
                        </div>
                        <div className="flex items-center pt-1 text-sm text-gray-600">
                            <span className="font-semibold">{tours.length}</span>
                            <span className="ml-1">past tour{tours.length === 1 ? "" : "s"}</span>
                            <span className="mx-2">•</span>
                            <span className="font-semibold">{reviews.length}</span>
                            <span className="ml-1">
                                review{reviews.length === 1 ? "" : "s"} written
                            </span>
                        </div>
                    </div>

                    {/* Simple summary card */}
                    <div className="md:col-span-2 md:pl-6 flex flex-col justify-center space-y-3">
                        <FieldLabel className="text-lg font-semibold text-gray-900">
                            Travel summary
                        </FieldLabel>
                        <FieldDescription className="text-gray-700 text-sm sm:text-md break-words">
                            {tours.length
                                ? `${tourist.name || "This tourist"} has completed ${tours.length} past tour${tours.length === 1 ? "" : "s"
                                }.`
                                : "This tourist has not completed any tours yet."}
                        </FieldDescription>
                        <FieldDescription className="text-gray-700 text-sm sm:text-md break-words">
                            {reviews.length
                                ? `They have written ${reviews.length} review${reviews.length === 1 ? "" : "s"
                                } about tours they joined.`
                                : "No written reviews yet."}
                        </FieldDescription>
                    </div>
                </div>

                {/* Past tours */}
                <div>
                    <div className="flex items-center justify-between mt-10">
                        <FieldLabel className="text-2xl font-semibold text-gray-900">
                            Past tours ({tours.length})
                        </FieldLabel>
                    </div>
                    {tours.length === 0 ? (
                        <FieldDescription className="text-gray-500 text-sm">
                            This tourist has not completed any tours yet.
                        </FieldDescription>
                    ) : (
                        <div className="relative flex items-center p-8">
                            <Button
                                className="absolute left-0 z-10 p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 hidden md:flex items-center justify-center"
                                onClick={() => scrollTours("left")}
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-700" />
                            </Button>
                            <div
                                ref={tourListRef}
                                className="flex overflow-x-auto scrollbar-hide space-x-5 py-2 px-1 snap-x snap-mandatory scroll-smooth"
                            >
                                {tours.map((tour) => (
                                    <PastTourCard key={tour.id} tour={tour} onViewTour={handleViewTour} />
                                ))}
                            </div>
                            <Button
                                className="absolute right-0 z-10 p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 hidden md:flex items-center justify-center"
                                onClick={() => scrollTours("right")}
                            >
                                <ChevronRight className="w-5 h-5 text-gray-700" />
                            </Button>
                        </div>
                    )}
                </div>

                <FieldSeparator className="p-10" />

                {/* Recent reviews */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <FieldLabel className="text-2xl font-semibold text-gray-900">
                            Recent reviews
                        </FieldLabel>
                        {!!reviews.length && (
                            <FieldDescription className="text-sm text-gray-500">
                                {reviews.length} review{reviews.length === 1 ? "" : "s"}
                            </FieldDescription>
                        )}
                    </div>
                    {reviews.length === 0 ? (
                        <FieldDescription className="text-gray-500 text-sm">
                            No reviews yet. Be the first to share your experience!
                        </FieldDescription>
                    ) : (
                        <RatingList ratings={reviews} showTourName={true} hideStars={true} />
                    )}
                </div>
            </div>
        </div>
    );
}