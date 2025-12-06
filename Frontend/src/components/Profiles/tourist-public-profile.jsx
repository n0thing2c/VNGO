import React, {useCallback, useEffect, useRef, useState} from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    LandPlot,
    Languages,
    MapPin,
    Star,
    Mail,
    Mars,
    Venus,
    MessageSquare,
} from "lucide-react";
import {Button} from "@/components/ui/button.jsx";
import {profileService} from "@/services/profileService.js";
import {useAuthStore} from "@/stores/useAuthStore.js";
import RatingList from "@/components/rating/ratings.jsx";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "@/constant.js";
import {
    FieldLabel,
    FieldSeparator,
    FieldDescription,
} from "@/components/ui/field.jsx";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog.jsx";
import defaultBanner from "@/assets/Banner.svg";

const DEFAULT_AVATAR = "https://placehold.co/112x112/A0A0A0/ffffff?text=User";

const StarRating = ({rating = 0}) => {
    const value = Number(rating) || 0;
    return (
        <div className="flex items-center space-x-0.5">
            {Array.from({length: 5}).map((_, idx) => {
                const isFilled = idx + 1 <= Math.round(value);
                return (
                    <Star
                        key={idx}
                        className={`w-4 h-4 ${
                            isFilled ? "text-yellow-400" : "text-gray-300"
                            }`}
                        fill="currentColor"
                    />
                );
            })}
        </div>
    );
};

const PastTourCard = ({tour, onViewTour}) => (
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
                {tour.guideName ? `With guide ${tour.guideName}`
                    : "Attended tour"}
            </p>

            <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                <StarRating rating={tour.rating || 0}/>
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

export function TouristPublicProfile({touristId}) {
    // const {user} = useAuthStore();
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
            tourist: r.tourist || {username: "Anonymous", avatar: null},
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
            const profileRes = await profileService.getTouristPublicProfile(
                touristId
            );

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

    if (error || !tourist)
        return (
            <div className="py-16 text-center text-red-500">
                {error || "Tourist not found."}
            </div>
        );

    return (
        <div className="min-h-screen w-full bg-white">
            <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-8 pt-8">
                <div className="flex flex-col space-y-8 pb-12">
                    {/* Info Card - Facebook Style */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Banner */}
                        <div
                            className="relative w-full h-48 md:h-64 bg-gray-200"
                            style={{
                                backgroundImage: `url(${
                                    tourist.banner_image || defaultBanner
                                    })`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        />

                        {/* Profile Section */}
                        <div className="relative px-6 pb-6">
                            {/* Avatar - Overlap với banner */}
                            <div className="relative -mt-16 md:-mt-20 mb-4">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div
                                            className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer">
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
                                    </DialogTrigger>
                                    <DialogContent
                                        className="sm:max-w-[600px] p-0 bg-transparent border-none shadow-none flex justify-center items-center">
                                        <div className="sr-only">
                                            <DialogTitle>
                                                {tourist.name}'s Profile Picture
                                            </DialogTitle>
                                            <DialogDescription>
                                                Full size view of the profile picture
                                            </DialogDescription>
                                        </div>
                                        <img
                                            src={tourist.face_image || DEFAULT_AVATAR}
                                            alt={tourist.name}
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
                                <h2 className="text-3xl md:text-4xl font-bold text-vngo-primary mb-4">
                                    {tourist.name}
                                </h2>

                                {/* Other Info */}
                                <div className="space-y-2">
                                    <div className="flex items-center text-gray-600 text-base md:text-lg">
                                        <MapPin className="w-5 h-5 md:w-5 md:h-5 mr-2 text-red-600 shrink-0" />
                                        <span className="truncate">
                                            {tourist.nationality || "Nationality not provided"}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-600 text-base md:text-lg">
                                        <Calendar className="w-5 h-5 md:w-5 md:h-5 mr-2 text-orange-400 shrink-0"/>
                                        <span>
                                            {tourist.age
                                                ? `${tourist.age} years old`
                                                : "Age not provided"}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-600 text-base md:text-lg">
                                        {tourist.gender === "Male" && (
                                            <Mars className="w-5 h-5 mr-2 shrink-0" color="#3b82f6"/>
                                        )}
                                        {tourist.gender === "Female" && (
                                            <Venus
                                                className="w-5 h-5 mr-2 shrink-0"
                                                color="#ec4899"
                                            />
                                        )}
                                        <span>{tourist.gender ? ` ${tourist.gender}` : ""}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600 text-base md:text-lg">
                                        <Mail className="w-5 h-5 md:w-5 md:h-5 mr-2 text-green-600 shrink-0"/>
                                        <span className="truncate">
                                            {tourist.email || "Email not provided"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Attended Tours */}
                        <div
                            className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-blue-600"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Attended tours</p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {tours.length}
                                </p>
                            </div>
                        </div>

                        {/* Written Reviews */}
                        <div
                            className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                            <div className="p-3 bg-yellow-50 rounded-lg flex items-center justify-center">
                                <Star className="w-6 h-6 text-yellow-400"/>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Written reviews</p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {reviews.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Past Tours */}
                    <div className="w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calendar className="w-6 h-6 text-vngo-primary"/>
                            </div>
                            <div className="flex items-center justify-between flex-1">
                                <h3 className="text-2xl md:text-3xl font-semibold text-vngo-primary">
                                    Attended tours
                                </h3>
                                <span className="text-lg text-gray-500">({tours.length})</span>
                            </div>
                        </div>
                        {tours.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                This tourist has not attended any tours yet.
                            </p>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Button
                                    className="p-5 rounded-full bg-white border border-gray-200 hover:bg-gray-100 shadow-sm hidden md:flex items-center justify-center shrink-0"
                                    onClick={() => scrollTours("left")}
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-700"/>
                                </Button>
                                <div
                                    ref={tourListRef}
                                    className="flex overflow-x-auto scrollbar-hide space-x-5 py-2 snap-x snap-mandatory scroll-smooth"
                                >
                                    {tours.map((tour) => (
                                        <PastTourCard
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
                                    <ChevronRight className="w-5 h-5 text-gray-700"/>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Written Reviews */}
                    <div className="w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-6">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-purple-600"/>
                            </div>
                            <div className="flex items-center justify-between flex-1">
                                <h3 className="text-2xl md:text-3xl font-semibold text-vngo-primary">
                                    Written reviews
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
                                No reviews yet.
                            </p>
                        ) : (
                            <div className="text-lg">
                                <RatingList ratings={reviews} showTourName={true}/>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
