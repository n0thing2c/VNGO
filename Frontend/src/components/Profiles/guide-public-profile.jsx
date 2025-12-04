import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ChevronLeft,
    ChevronRight,
    Globe,
    Heart,
    Languages,
    MapPin,
    MessageCircleMore,
    Star,
    Calendar,
    LandPlot,
    Mars,
    Venus,
} from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { tourService } from "@/services/tourService.js";
import { profileService } from "@/services/profileService.js";
import { useAuthStore } from "@/stores/useAuthStore.js";
import RatingList from "@/components/rating/ratings.jsx";
import Rate from "@/components/rating/rate.jsx";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constant.js";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog.jsx";
import {
    FieldLabel,
    FieldSeparator,
    FieldDescription,
} from "@/components/ui/field.jsx";
import { AchievementBadge } from "@/components/TourPost/tour_achievements.jsx";

const buildRoomName = (touristUsername, guideUsername) => {
    if (!touristUsername || !guideUsername) return null;
    return `${touristUsername}__${guideUsername}`;
};

const DEFAULT_AVATAR = "https://placehold.co/112x112/A0A0A0/ffffff?text=Guide";

const StarRating = ({ rating = 0 }) => {
    const value = Number(rating) || 0;
    return (
        <div className="flex items-center space-x-0.5">
            {Array.from({ length: 5 }).map((_, idx) => {
                const isFilled = idx + 1 <= Math.round(value);
                return (
                    <Star
                        key={idx}
                        className={`w-4 h-4 ${isFilled ? "text-yellow-400" : "text-gray-300"
                            }`}
                        fill="currentColor"
                    />
                );
            })}
        </div>
    );
};
const HeartRating = ({ rating = 0 }) => {
    const value = Number(rating) || 0;
    return (
        <div className="flex items-center space-x-0.5">
            {Array.from({ length: 5 }).map((_, idx) => {
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

const TourCard = ({ tour, onViewTour }) => (
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
            <h4 className="font-semibold text-vngo-normal-medium-responsive truncate">
                {tour.title}
            </h4>
            <p className="text-vngo-normal-small-responsive text-gray-500 line-clamp-1 mt-1">
                {tour.description || "No description provided."}
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <StarRating rating={tour.rating} />
                <span className="font-medium">
                    {(tour.rating || 0).toFixed(1)} ({tour.reviews || 0})
                </span>
            </div>

            {/* Button always at bottom */}
            <div className="mt-auto flex justify-start">
                <Button
                    className="btn-vngo-hover-effect px-4 py-2 text-vngo-normal-responsive rounded-full bg-neutral-900 hover:bg-neutral-800 text-white"
                    onClick={() => onViewTour?.(tour.id)}
                >
                    View tour
                </Button>
            </div>
        </div>
    </div>
);

export function GuidePublicProfile({ guideId }) {
    const { user } = useAuthStore();
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
    // const [activeTab, setActiveTab] = useState("bio"); // "bio" or "achievements"
    const [averageRating, setAverageRating] = useState(0);

    const chatPayload = useMemo(() => {
        if (!guide || !user) return null;
        const roomName = buildRoomName(user.username, guide.username);
        if (!roomName) return null;
        return {
            targetRoom: roomName,
            targetUser: {
                id: guide.id,
                username: guide.username,
                name: guide.name,
                avatar: guide.face_image,
                avatar_url: guide.face_image,
            },
        };
    }, [guide, user]);

    const handleMessageClick = () => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (!chatPayload) return;

        navigate("/chat", {
            state: chatPayload,
        });
    };

    const normalizeReviews = (data) => {
        return (data || []).map((r) => ({
            ...r,
            review_tags: Array.isArray(r.review_tags) ? r.review_tags : [],
            tourist: r.tourist || { username: "Anonymous", avatar: null },
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
            const [profileRes, toursRes, reviewsRes, achievementsRes] =
                await Promise.all([
                    profileService.getGuidePublicProfile(guideId),
                    tourService.getAllToursByGuide(guideId),
                    tourService.getAllTourRatingsByGuide(guideId),
                    profileService.getGuideAchievements(guideId),
                ]);

            if (profileRes.success) setGuide(profileRes.data);
            else setGuide(null);

            if (toursRes.success) setTours(toursRes.data || []);
            else setTours([]);

            // if (reviewsRes.success) setReviews(normalizeReviews(reviewsRes.data));
            // else setReviews([]);

            // if (profileRes.success) setGuide(profileRes.data);
            // else setGuide(null);

            // if (toursRes.success) setTours(toursRes.data || []);
            // else setTours([]);

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
                setGuide((prev) => ({
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
        return (
            <div className="py-16 text-center text-gray-600">Loading profile...</div>
        );

    if (error || !guide)
        return (
            <div className="py-16 text-center text-red-500">
                {error || "Guide not found."}
            </div>
        );

    return (
        <div className="min-h-screen w-full">
            {/* THAY ĐỔI LAYOUT CHÍNH:
                - w-full: chiếm hết chiều ngang 
                - max-w-[1440px]: Chặn lại khi màn hình quá to (hoặc zoom out)
                - px-4 sm:px-8: Padding 2 bên để không dính sát lề
            */}
            <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-8 pt-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Info and Stats */}
                    <div className="lg:col-span-4 xl:col-span-3 flex flex-col space-y-6">
                        {/* Info Block */}
                        <div className="flex flex-col space-y-4 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                            {/* Avatar + Name */}
                            <div className="flex flex-col items-center space-y-2">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="relative h-45 w-45 md:h-50 md:w-50 rounded-full overflow-hidden border-2 border-white ring-2 ring-gray-300 cursor-pointer">
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
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[600px] p-0 bg-transparent border-none shadow-none flex justify-center items-center">
                                        <div className="sr-only">
                                            <DialogTitle>{guide.name}'s Profile Picture</DialogTitle>
                                            <DialogDescription>Full size view of the profile picture</DialogDescription>
                                        </div>
                                        <img
                                            src={guide.face_image || DEFAULT_AVATAR}
                                            alt={guide.name}
                                            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = DEFAULT_AVATAR;
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                                <FieldLabel className="text-2xl md:text-3xl font-bold text-vngo-primary text-center">
                                    {guide.name}
                                </FieldLabel>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center justify-center pt-1">
                                <HeartRating rating={averageRating} />
                                <span className="text-sm md:text-base text-gray-600 ml-2 whitespace-nowrap">
                                    {averageRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? "" : "s"})
                                </span>
                            </div>

                            {/* Location & Languages */}
                            <div className="flex items-center text-gray-600 text-base md:text-lg">
                                <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2 text-red-600 shrink-0" />
                                <span className="truncate">
                                    {guide.location || "Location not provided"}
                                </span>
                            </div>
                            <div className="flex items-center text-gray-600 text-base md:text-lg">
                                {guide.gender === "Male" && (
                                    <Mars className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0" color="#3b82f6" />
                                )}
                                {guide.gender === "Female" && (
                                    <Venus className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0" color="#ec4899" />
                                )}
                                <span>{guide.gender ? ` ${guide.gender}` : ""}</span>
                            </div>
                            <div className="flex items-center text-gray-600 text-base md:text-lg">
                                <Languages className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-700 shrink-0" />
                                <span className="truncate">
                                    {guide.languages?.length
                                        ? guide.languages.join(", ")
                                        : "Languages not set"}
                                </span>
                            </div>

                            {/* Message Button */}
                            {userRole !== "guide" && (
                                <Button
                                    className={`w-full mt-4 rounded-full flex items-center justify-center gap-2 btn-vngo-hover-effect ${userRole === "tourist"
                                        ? "bg-[#068F64] text-white"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed hover:scale-100 hover:shadow-none"
                                        }`}
                                    onClick={handleMessageClick}
                                >
                                    <MessageCircleMore className="w-4 h-4" />
                                    Message{" "}
                                    {guide.name
                                        ? guide.name.trim().split(" ").slice(-1).join(" ")
                                        : guide.username}
                                </Button>
                            )}
                        </div>

                        {/* Stats Grid (Moved to Left) */}
                        {guide.stats && (
                            <div className="flex flex-col gap-4">
                                {/* Past Tours */}
                                <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Completed tours</p>
                                        <p className="text-xl font-semibold text-gray-900">
                                            {guide.stats.total_past_tours}
                                        </p>
                                    </div>
                                </div>

                                {/* Hosted Tours */}
                                <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                                    <div className="p-3 bg-purple-50 rounded-lg flex items-center justify-center">
                                        <LandPlot className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Offered tours</p>
                                        <p className="text-xl font-semibold text-gray-900">
                                            {guide.stats.total_tours}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Achievements, About Me, Tours, Reviews */}
                    <div className="lg:col-span-8 xl:col-span-9 w-full space-y-8">
                        {/* Achievements */}
                        <div className="w-full flex flex-col space-y-4 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-2xl md:text-3xl font-semibold text-vngo-primary border-b border-gray-200 pb-2">
                                Achievements
                            </h3>
                            <div className="grid grid-cols-10 gap-3 mb-10 w-full max-w-full justify-center">
                                {achievements?.length > 0 ? (
                                    achievements.map((ach, idx) => (
                                        <div key={idx} className="flex justify-center relative">
                                            <AchievementBadge variant={ach.toLowerCase()} label={ach} />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-lg col-span-10 text-center">
                                        No achievements yet.
                                    </p>
                                )}
                            </div>
                            {guide.stats && (
                                <>
                                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                                        <div
                                            className="h-full bg-vngo-primary transition-all duration-300"
                                            style={{
                                                width: `${(guide.stats.achievement_count / 15) * 100}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-base md:text-lg text-vngo-primary">
                                        {guide.stats.achievement_count} / 15 achievements unlocked
                                    </p>
                                </>
                            )}
                        </div>

                        {/* About Me */}
                        <div className="w-full flex flex-col space-y-4 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-2xl md:text-3xl font-semibold text-vngo-primary border-b border-gray-200 pb-2">
                                About me
                            </h3>
                            <FieldDescription className="text-gray-700 leading-loose text-base md:text-lg break-words whitespace-pre-wrap">
                                {guide.bio || "This guide has not added a bio yet. Check their tours and reviews below."}
                            </FieldDescription>
                        </div>

                        {/* Tours */}
                        <div>
                            <div className="flex items-center justify-between mt-2 border-b border-gray-200 pb-2">
                                <FieldLabel className="text-2xl md:text-3xl font-semibold text-vngo-primary">
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
                                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                                    </Button>
                                    <div
                                        ref={tourListRef}
                                        className="flex overflow-x-auto scrollbar-hide space-x-5 py-2 px-1 snap-x snap-mandatory scroll-smooth"
                                    >
                                        {tours.map((tour) => (
                                            <TourCard
                                                key={tour.id}
                                                tour={tour}
                                                onViewTour={handleViewTour}
                                            />
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

                        {/* <FieldSeparator className="p-10" /> */}

                        {/* Guide Reviews */}
                        <div>
                            <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                                <FieldLabel className="text-vngo-primary text-2xl md:text-3xl font-semibold">
                                    Recent reviews
                                </FieldLabel>
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
                                <div className="text-lg">
                                    <RatingList ratings={reviews} showTourName={true} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}