import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ChevronLeft, ChevronRight, Globe, Heart, Languages, MapPin, MessageCircleMore, Star} from "lucide-react";
import {Button} from "@/components/ui/button.jsx";
import {tourService} from "@/services/tourService.js";
import {profileService} from "@/services/profileService.js";
import {useAuthStore} from "@/stores/useAuthStore.js";
import RatingList from "@/components/rating/ratings.jsx";
import Rate from "@/components/rating/rate.jsx";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "@/constant.js";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog.jsx";
import {FieldLabel, FieldSeparator, FieldDescription} from "@/components/ui/field.jsx";
import {AchievementBadge} from "@/components/TourPost/tour_achievements.jsx";

const DEFAULT_AVATAR = "https://placehold.co/112x112/A0A0A0/ffffff?text=Guide";

const StarRating = ({rating = 0}) => {
    const value = Number(rating) || 0;
    return (
        <div className="flex items-center space-x-0.5">
            {Array.from({length: 5}).map((_, idx) => {
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
const HeartRating = ({rating = 0}) => {
    const value = Number(rating) || 0;
    return (
        <div className="flex items-center space-x-0.5">
            {Array.from({length: 5}).map((_, idx) => {
                const isFilled = idx + 1 <= Math.round(value);
                return (
                    <Heart
                        key={idx}
                        className={`w-4 h-4 ${isFilled ? "text-red-400" : "text-gray-300"}`}
                        fill="currentColor"
                    />
                );
            })}
        </div>
    );
};

const TourCard = ({tour, onViewTour}) => (
    <div
        className="flex flex-col min-w-[240px] w-[240px] h-[280px] bg-white rounded-lg overflow-hidden shadow-md border border-gray-100">
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
            <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                {tour.description || "No description provided."}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                <StarRating rating={tour.rating}/>
                <span>
        {(tour.rating || 0).toFixed(1)} ({tour.reviews || 0})
      </span>
            </div>

            {/* Button always at bottom */}
            <div className="mt-auto flex justify-start">
                <Button
                    className="px-3 py-1 text-xs rounded-full bg-neutral-900 hover:bg-neutral-800 text-white"
                    onClick={() => onViewTour?.(tour.id)}
                >
                    View tour
                </Button>
            </div>
        </div>
    </div>

);

export function GuidePublicProfile({guideId}) {
    const {user} = useAuthStore();
    const userRole = user?.role;
    const navigate = useNavigate();
    const [guide, setGuide] = useState(null);
    const [tours, setTours] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const tourListRef = useRef(null);
    const [achievements, setAchievements] = useState([]);
    const canRateGuide = user?.role === "tourist";
    const [activeTab, setActiveTab] = useState("bio"); // "bio" or "achievements"
    const [averageRating, setAverageRating] = useState(0);

    const normalizeReviews = (data) => {
        return (data || []).map((r) => ({
            ...r,
            review_tags: Array.isArray(r.review_tags) ? r.review_tags : [],
            tourist: r.tourist || {username: "Anonymous", avatar: null},
        }));
    };


    const fetchProfile = useCallback(async () => {
        if (!guideId) {
            setError("Missing guide id in the URL.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const [profileRes, toursRes, reviewsRes, achievementsRes] = await Promise.all([
                profileService.getGuidePublicProfile(guideId),
                tourService.getAllToursByGuide(guideId),
                tourService.getAllTourRatingsByGuide(guideId),
                profileService.getGuideAchievements(guideId),
            ]);

            if (profileRes.success) setGuide(profileRes.data);
            else setGuide(null);

            if (toursRes.success) setTours(toursRes.data || []);
            else setTours([]);

            if (reviewsRes.success) setReviews(normalizeReviews(reviewsRes.data));
            else setReviews([]);

            if (profileRes.success) setGuide(profileRes.data);
            else setGuide(null);

            if (toursRes.success) setTours(toursRes.data || []);
            else setTours([]);


            if (reviewsRes.success) {
                const normalized = normalizeReviews(reviewsRes.data);
                setReviews(normalized);

                // Compute average rating
                if (normalized.length > 0) {
                    const total = normalized.reduce((sum, r) => sum + (r.rating || 0), 0);
                    setAverageRating(total / normalized.length);
                } else {
                    setAverageRating(0);
                }
            } else {
                setReviews([]);
                setAverageRating(0);
            }
            if (achievementsRes.success) {
                setAchievements(achievementsRes.data?.achievements || []);
                setGuide(prev => ({
                    ...prev,
                    stats: achievementsRes.data?.stats || null,
                }));
            } else {
                setAchievements([]);
            }

        } catch (err) {
            console.error("Failed to load guide profile:", err);
            setError("Unable to load guide information. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [guideId]);

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
        return <div className="py-16 text-center text-red-500">{error || "Guide not found."}</div>;

    return (
        <div className="min-h-screen w-full">
            <div className="mx-auto w-full md:max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 pb-12 space-y-8">
                {/* Guide Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        className="flex flex-col space-y-3 border-b md:border-b-0 md:border-r-1 border-black md:pr-6 pb-4 md:pb-0">
                        {/* Avatar + Name */}
                        <div className="flex flex-col items-center space-y-2">
                            <div
                                className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-white ring-2 ring-gray-300">
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
                            <FieldLabel className="text-xl font-bold text-gray-900 text-center">
                                {guide.name}
                            </FieldLabel>
                        </div>

                        {/* Other Info (left-aligned) */}
                        <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 mr-1 text-red-600"/>
                            <span>{guide.location || "Location not provided"}</span>
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                            <Languages className="w-4 h-4 mr-1 text-blue-700"/>
                            <span>{guide.languages?.length ? guide.languages.join(", ") : "Languages not set"}</span>
                        </div>
                        <div className="flex items-center pt-1">
                            <HeartRating rating={averageRating}/>
                            <span className="text-sm text-gray-600 ml-2">
                                {averageRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? "" : "s"})
                            </span>
                        </div>


                        {/*                {userRole !== "guide" && (*/}
                        {/*  <Button*/}
                        {/*    className="bg-[#068F64] rounded-2xl w-auto h-auto text-[9px] flex items-center gap-1"*/}
                        {/*    onClick={handleMessageClick}*/}
                        {/*  >*/}
                        {/*    <MessageCircleMore /> Message{" "}*/}
                        {/*    {guide.name*/}
                        {/*      ? guide.name.trim().split(" ").slice(-1).join(" ")*/}
                        {/*      : guide.username}*/}
                        {/*  </Button>*/}
                        {/*)}*/}
                    </div>


                    {/* Bio + Achievements Tabs */}
                    <div className="md:col-span-2 md:pl-6">
                        <div className="flex border-b border-gray-300 mb-4">
                            <button
                                className={`w-1/2 text-center px-4 py-2 text-sm font-medium ${
                                    activeTab === "bio"
                                        ? "border-b-2 border-gray-900 text-black"
                                        : "text-gray-600"
                                }`}
                                onClick={() => setActiveTab("bio")}
                            >
                                About me
                            </button>

                            <button
                                className={`w-1/2 text-center px-4 py-2 text-sm font-medium ${
                                    activeTab === "achievements"
                                        ? "border-b-2 border-gray-900 text-black"
                                        : "text-gray-600"
                                }`}
                                onClick={() => setActiveTab("achievements")}
                            >
                                Achievements
                            </button>
                        </div>


                        {/* Tabs content */}
                        {activeTab === "bio" && (
                            <FieldDescription className="text-gray-700 leading-loose text-sm sm:text-md break-words">
                                {guide.bio || "This guide has not added a bio yet. Check their tours and reviews below."}
                            </FieldDescription>
                        )}

                        {activeTab === "achievements" && (
                            <div className="mt-2 space-y-2">
                                {/* Achievements badges */}
                                <div className="flex flex-wrap gap-5 justify-center mt-15">
                                    {achievements?.length > 0 ? (
                                        achievements.map((ach, idx) => (
                                            <AchievementBadge key={idx} variant={ach.toLowerCase()} label={ach}/>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">No achievements yet.</p>
                                    )}
                                </div>

                                {/* Stats line with highlighted numbers and separators */}
                                {guide.stats && (
                                    <p className="text-gray-600 text-sm mt-15 text-center">
                                        <span className="text-gray-600 font-normal">
                                            Past tours: <span
                                            className="text-black font-semibold">{guide.stats.total_past_tours}</span>
                                        </span>
                                        <span className="mx-5">|</span>
                                        <span className="text-black font-normal">
                                            Hosted tours: <span
                                            className="text-black font-semibold">{guide.stats.total_tours}</span>
                                        </span>
                                        <span className="mx-5">|</span>
                                        <span className="text-gray-600 font-normal">
                                            Achievements: <span
                                            className="text-black font-semibold">{guide.stats.achievement_count} / 5</span>
                                        </span>
                                    </p>
                                )}

                            </div>
                        )}

                    </div>
                </div>

                {/* Tours */}
                <div>
                    <div className="flex items-center justify-between mt-10">
                        <FieldLabel className="text-2xl font-semibold text-gray-900">
                            Tours ({tours.length})
                        </FieldLabel>
                    </div>
                    {tours.length === 0 ? (
                        <FieldDescription className="text-gray-500 text-sm">
                            This guide has not published any tours yet.
                        </FieldDescription>
                    ) : (
                        <div className="relative flex items-center p-8">
                            <Button
                                className="absolute left-0 z-10 p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 hidden md:flex items-center justify-center"
                                onClick={() => scrollTours("left")}
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-700"/>
                            </Button>
                            <div
                                ref={tourListRef}
                                className="flex overflow-x-auto scrollbar-hide space-x-5 py-2 px-1 snap-x snap-mandatory scroll-smooth"
                            >
                                {tours.map((tour) => (
                                    <TourCard key={tour.id} tour={tour} onViewTour={handleViewTour}/>
                                ))}
                            </div>
                            <Button
                                className="absolute right-0 z-10 p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-100 hidden md:flex items-center justify-center"
                                onClick={() => scrollTours("right")}
                            >
                                <ChevronRight className="w-5 h-5 text-gray-700"/>
                            </Button>
                        </div>
                    )}
                </div>

                <FieldSeparator className="p-10"/>
                {/* Guide Reviews */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <FieldLabel className="text-2xl font-semibold text-gray-900">Recent reviews</FieldLabel>
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
                        <RatingList ratings={reviews} showTourName={true}/>
                    )}
                </div>
            </div>
        </div>


    );
}
