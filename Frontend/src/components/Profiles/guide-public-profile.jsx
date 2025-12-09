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
    Award,
    BookOpen,
    MessageSquare, CircleQuestionMark,
} from "lucide-react";
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
import {
    FieldLabel,
    FieldSeparator,
    FieldDescription,
} from "@/components/ui/field.jsx";
import {AchievementBadge} from "@/components/achievement/achievementbadges.jsx";
import {AchievementDialog} from "@/components/achievement/achievementdialog.jsx";
import defaultBanner from "@/assets/banner.svg";

const buildRoomName = (touristUsername, guideUsername) => {
    if (!touristUsername || !guideUsername) return null;
    return `${touristUsername}__${guideUsername}`;
};

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
        className="flex flex-col min-w-[300px] w-[300px] h-[400px] bg-white rounded-lg overflow-hidden shadow-md border border-gray-100">
        <img
            src={tour.image}
            alt={tour.title}
            className="h-40 w-full object-cover"
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://placehold.co/300x180/4F68C4/ffffff?text=Tour";
            }}
        />

        <div className="flex flex-col p-4 flex-1 gap-3">
            <h4 className="font-semibold text-base leading-tight text-vngo-primary">
                {tour.title}
            </h4>
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
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
        const scrollAmount = 320; // 300px card width + 20px gap
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
        <div className="min-h-screen w-full bg-white">
            <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-8 pt-8">
                <div className="flex flex-col space-y-8 pb-12">
                    {/* Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Banner */}
                        <div
                            className="relative w-full h-48 md:h-64 bg-gray-200"
                            style={{
                                backgroundImage: `url(${guide.banner_image || defaultBanner})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        />

                        {/* Profile Section */}
                        <div className="relative px-6 pb-6">
                            {/* Avatar - Overlap with banner */}
                            <div className="relative -mt-16 md:-mt-20 mb-4">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div
                                            className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer">
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
                                    <DialogContent
                                        className="sm:max-w-[600px] p-0 bg-transparent border-none shadow-none flex justify-center items-center">
                                        <div className="sr-only">
                                            <DialogTitle>{guide.name}'s Profile Picture</DialogTitle>
                                            <DialogDescription>
                                                Full size view of the profile picture
                                            </DialogDescription>
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
                            </div>

                            {/* Name and Info */}
                            <div className="mt-2">
                                <h2 className="text-3xl md:text-4xl font-bold text-vngo-primary mb-2">
                                    {guide.name}
                                </h2>

                                {/* Rating */}
                                <div className="flex items-center mb-4">
                                    <HeartRating rating={averageRating} />
                                    <span className="text-sm md:text-base text-gray-600 ml-2 whitespace-nowrap">
                                        {averageRating.toFixed(1)} ({reviews.length} review
                                        {reviews.length === 1 ? "" : "s"})
                                    </span>
                                </div>

                                {/* Location & Languages */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-gray-600 text-base md:text-lg">
                                        <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2 text-red-600 shrink-0" />
                                        <span className="truncate">
                                            {guide.location || "Location not provided"}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-600 text-base md:text-lg">
                                        {guide.gender === "Male" && (
                                            <Mars
                                                className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0"
                                                color="#3b82f6"
                                            />
                                        )}
                                        {guide.gender === "Female" && (
                                            <Venus
                                                className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0"
                                                color="#ec4899"
                                            />
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
                                </div>

                                {/* Message Button */}
                                {userRole !== "guide" && (
                                    <Button
                                        className={`rounded-lg flex items-center justify-center gap-2 btn-vngo-hover-effect px-6 py-2 ${userRole === "tourist"
                                                ? "bg-[#068F64] text-white hover:bg-[#057A56]"
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
                        </div>
                    </div>

                    {/* Stats Grid */}
                    {guide.stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Completed Tours */}
                            <div
                                className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
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

                            {/* Offered Tours */}
                            <div
                                className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
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

                    {/* Achievements */}
                    <div
                        className="w-full flex flex-col space-y-4 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <Award className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="flex justify-between w-full">
                                <h3 className="text-2xl md:text-3xl font-semibold text-vngo-primary">
                                    Achievements
                                </h3>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <CircleQuestionMark color="gray" className="h-5 w-5" />
                                    </DialogTrigger>
                                    <DialogContent>
                                        <div className="flex flex-col gap-2">
                                            <DialogTitle> All Achievements </DialogTitle>
                                            <DialogDescription>Hover over a locked badge to see how to unlock it</DialogDescription>
                                        </div>
                                        <AchievementDialog achieved={achievements} />
                                    </DialogContent>

                                </Dialog>

                            </div>

                        </div>
                        <div
                            className="grid xl:grid-cols-12 lg:grid-cols-10 md:grid-cols-7 sm:grid-cols-5 gap-3 mb-6 w-full max-w-full justify-center">
                            {achievements?.length > 0 ? (
                                achievements.map((ach, idx) => (
                                    <div key={idx} className="flex justify-center relative">
                                        <AchievementBadge variant={ach.toLowerCase()} label={ach} />
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-lg xl:col-span-12 lg:col-span-10 md:col-span-7 sm:col-span-5 flex justify-center">
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
                    <div
                        className="w-full flex flex-col space-y-4 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <BookOpen className="w-6 h-6 text-vngo-primary" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-semibold text-vngo-primary">
                                About me
                            </h3>
                        </div>
                        <p className="text-gray-700 leading-loose text-base md:text-lg break-words whitespace-pre-wrap">
                            {guide.bio ||
                                "This guide has not added a bio yet. Check their tours and reviews below."}
                        </p>
                    </div>

                    {/* Tours */}
                    <div className="w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-6">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <MapPin className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex items-center justify-between flex-1">
                                <h3 className="text-2xl md:text-3xl font-semibold text-vngo-primary">
                                    Tours
                                </h3>
                                <span className="text-lg text-gray-500">({tours.length})</span>
                            </div>
                        </div>
                        {tours.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                This guide has not published any tours yet.
                            </p>
                        ) : (
                            <div className="flex items-center justify-between gap-4 w-full">
                                <Button
                                    className="p-5 rounded-full bg-white border border-gray-200 hover:bg-gray-100 shadow-sm hidden md:flex items-center justify-center shrink-0"
                                    onClick={() => scrollTours("left")}
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                                </Button>
                                <div
                                    ref={tourListRef}
                                    className="flex-1 flex overflow-x-auto scrollbar-hide space-x-5 py-2 snap-x snap-mandatory scroll-smooth"
                                >
                                    {tours.map((tour) => (
                                        <TourCard
                                            key={tour.id}
                                            tour={tour}
                                            onViewTour={handleViewTour}
                                        />
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
                                    className="p-5 rounded-full bg-white border border-gray-200 hover:bg-gray-100 shadow-sm hidden md:flex items-center justify-center shrink-0"
                                    onClick={() => scrollTours("right")}
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-700" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Recent Reviews */}
                    <div className="w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-6">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex items-center justify-between flex-1">
                                <h3 className="text-2xl md:text-3xl font-semibold text-vngo-primary">
                                    Recent reviews
                                </h3>
                                {!!reviews.length && (
                                    <span className="text-base md:text-lg text-gray-500">
                                        {reviews.length} review{reviews.length === 1 ? "" : "s"}
                                    </span>
                                )}
                            </div>
                        </div>
                        {reviews.length === 0 ? (
                            <p className="text-gray-500 text-base md:text-lg">
                                No reviews yet. Be the first to share your experience!
                            </p>
                        ) : (
                            <div className="text-lg">
                                <RatingList ratings={reviews} showTourName={true} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
