import React, { useCallback, useEffect, useRef, useState } from "react";
import {Calendar, ChevronLeft, ChevronRight, Languages, MapPin, Star,} from "lucide-react";
import { Mars, Venus } from "lucide-react";
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
    <div
        className="flex flex-col min-w-[240px] w-[240px] h-[360px] bg-white rounded-lg overflow-hidden shadow-md border border-gray-100">
        <img
            src={tour.image}
            alt={tour.title}
            className="h-40 w-full object-cover"
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/240x180/4F68C4/ffffff?text=Tour";
            }}
        />

        <div className="flex flex-col p-4 flex-1 gap-3">
            <h4 className="font-semibold text-vngo-normal-medium-responsive truncate">{tour.title}</h4>
            <p className="text-vngo-normal-responsive text-gray-500 line-clamp-1 mt-1">
                {tour.guideName ? `With guide ${tour.guideName}` : "Completed tour"}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                <StarRating rating={tour.rating || 0} />
                <span>{tour.rating ? tour.rating.toFixed(1) : "No rating"}</span>
            </div>

            {/* Button always at bottom */}
            <div className="mt-auto flex justify-start">
                <Button
                    className="btn-vngo-hover-effect px-4 py-2 text-vngo-normal-responsive rounded-full bg-neutral-900 hover:bg-neutral-800 text-white"
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
    const [guide, setGuide] = useState(null); // holds tourist profile
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

                setGuide(profile);
                setTours(pastTours);

                const normalized = normalizeReviews(ratings);
                setReviews(normalized);
            } else {
                setGuide(null);
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

    if (error || !guide)
        return (
            <div className="py-16 text-center text-red-500">
                {error || "Tourist not found."}
            </div>
        );

    return (
        <div className="min-h-screen w-full">
            <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-8 pt-8 pb-12 space-y-8">
                {/* Tourist Info */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div
                        className="lg:col-span-4 xl:col-span-3 flex flex-col space-y-4 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                        {/* Avatar + Name */}
                        <div className="flex flex-col items-center space-y-2">
                            <div
                                className="relative h-30 w-30 md:h-38 md:w-38 rounded-full overflow-hidden border-2 border-white ring-2 ring-gray-300">
                                <img
                                    src={guide.face_image || DEFAULT_AVATAR}
                                    alt={guide.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = DEFAULT_AVATAR;
                                    }}
                                />
                            </div>
                            <FieldLabel className="text-2xl md:text-3xl font-bold text-vngo-primary text-center">
                                {guide.name}
                            </FieldLabel>
                        </div>

                        {/* Other Info */}
                        <div className="flex items-center text-gray-600 text-base md:text-lg">
                            <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2 text-red-600 shrink-0"/>
                            <span>{guide.nationality || "Nationality not provided"}</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-base md:text-lg">
                            <Calendar className="w-4 h-4 md:w-5 md:h-5 mr-2 text-orange-400 shrink-0"/>
                            <span>
                                {guide.age ? `${guide.age} years old` : "Age not provided"}
                            </span>
                        </div>
                        <div className="flex items-center text-gray-600 text-base md:text-lg">
                          {guide.gender === "Male" && (
                            <Mars className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0" color="#3b82f6" />
                          )}
                          {guide.gender === "Female" && (
                            <Venus className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0" color="#ec4899" />
                          )}
                          <span>
                            {guide.gender ? ` • ${guide.gender}` : ""}
                          </span>
                        </div>


                    </div>

                    {/* Simple summary card */}
                    <div
                        className="lg:col-span-8 xl:col-span-9 w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200 h-full">
                        <FieldLabel className="text-vngo-primary text-2xl md:text-3xl font-semibold pb-2 mb-5">
                            Travel summary
                        </FieldLabel>
                        <FieldDescription className="text-gray-700 text-sm sm:text-md break-words">
                            {tours.length
                                ? `${guide.name || "This tourist"} has completed ${tours.length} past tour${tours.length === 1 ? "" : "s"
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
                    <div className="flex items-center justify-between mt-2">
                        <FieldLabel className="text-vngo-primary text-2xl md:text-3xl font-semibold">
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
                                <style>
                                    {`
                                      /* Hide scrollbar for Chrome, Safari and Opera */
                                      div::-webkit-scrollbar {
                                        display: none;
                                      }
                                    `}
                                </style>
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

                <FieldSeparator className="p-10"/>
                {/* Guide Reviews */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <FieldLabel className="text-vngo-primary text-2xl md:text-3xl font-semibold">Recent
                            reviews</FieldLabel>
                        {!!reviews.length && (
                            <FieldDescription className="text-base md:text-lg text-gray-500">
                                {reviews.length} review{reviews.length === 1 ? "" : "s"}
                            </FieldDescription>
                        )}
                    </div>
                    {reviews.length === 0 ? (
                        <FieldDescription className="text-gray-500 text-base md:text-lg">
                            No reviews yet. Be the first to share your experience!
                        </FieldDescription>
                    ) : (
                        // Wrapper này đảm bảo RatingList có không gian để hiển thị to hơn
                        // Lưu ý: Nếu RatingList set cứng font-size bên trong file đó thì bạn cần vào file ratings.jsx để sửa thêm.
                        // Ở đây tôi set text base to lên để override nếu dùng tailwind inherits.
                        <div className="text-lg">
                            <RatingList ratings={reviews} showTourName={true}/>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}