import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Globe, MapPin, Star } from "lucide-react";
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
            className={`w-4 h-4 ${isFilled ? "text-yellow-400" : "text-gray-300"}`}
            fill="currentColor"
          />
        );
      })}
    </div>
  );
};

const TourCard = ({ tour, onViewTour }) => (
  <div className="min-w-[240px] w-[240px] bg-white rounded-lg overflow-hidden shadow-md transition-shadow hover:shadow-lg border border-gray-100 snap-start">
    <img
      src={tour.image}
      alt={tour.title}
      className="h-32 w-full object-cover"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "https://placehold.co/240x180/4F68C4/ffffff?text=Tour";
      }}
    />
    <div className="p-3 flex flex-col gap-2">
      <div>
        <h4 className="font-semibold text-sm truncate">{tour.title}</h4>
        <p className="text-xs text-gray-500 line-clamp-3 mt-1">
          {tour.description || "No description provided."}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <StarRating rating={tour.rating} />
        <span>
          {(tour.rating || 0).toFixed(1)} ({tour.reviews || 0})
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
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

export function GuidePublicProfile({ guideId }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [tours, setTours] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tourListRef = useRef(null);

  const canRateGuide = user?.role === "tourist";

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
      const [profileRes, toursRes, reviewsRes] = await Promise.all([
        profileService.getGuidePublicProfile(guideId),
        tourService.getAllToursByGuide(guideId),
        profileService.getGuideRatings(guideId),
      ]);

      if (profileRes.success) setGuide(profileRes.data);
      else setGuide(null);

      if (toursRes.success) setTours(toursRes.data || []);
      else setTours([]);

      if (reviewsRes.success) setReviews(normalizeReviews(reviewsRes.data));
      else setReviews([]);
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

  const ratingValue = useMemo(() => Number(guide?.average_rating || 0), [guide]);

  const handleViewTour = (tourId) => {
    if (!tourId) return;
    navigate(ROUTES.TOUR_POST(tourId));
  };

  const handleRated = async () => {
    try {
      const reviewsRes = await profileService.getGuideRatings(guideId);
      if (reviewsRes.success) setReviews(normalizeReviews(reviewsRes.data));
    } catch (err) {
      console.error("Failed to fetch reviews after rating:", err);
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-[92%] md:max-w-4xl pt-8 pb-12 space-y-8">
        {/* Guide Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex flex-col items-center md:items-start space-y-3 border-b md:border-b-0 md:border-r border-gray-200 md:pr-6 pb-4 md:pb-0">
            <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-white ring-2 ring-gray-300 shadow-md">
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
            <h1 className="text-xl font-bold text-gray-900">{guide.name}</h1>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1 text-red-500" />
              <span>{guide.location || "Location not provided"}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <Globe className="w-4 h-4 mr-1 text-blue-500" />
              <span>{guide.languages?.length ? guide.languages.join(", ") : "Languages not set"}</span>
            </div>
            <div className="flex items-center pt-1">
              <StarRating rating={ratingValue} />
              <span className="text-sm text-gray-600 ml-2">
                {ratingValue.toFixed(1)} ({guide.rating_count || 0} ratings)
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {guide.tours_count} published {guide.tours_count === 1 ? "tour" : "tours"}
            </div>
          </div>

          <div className="md:col-span-2 md:pl-6">
            <h2 className="text-lg font-semibold text-blue-600 mb-3">About this guide</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              {guide.bio || "This guide has not added a bio yet. Check their tours and reviews below."}
            </p>
          </div>
        </div>

        {/* Tours */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Tours ({tours.length})</h2>
          </div>
          {tours.length === 0 ? (
            <p className="text-gray-500 text-sm">This guide has not published any tours yet.</p>
          ) : (
            <div className="relative flex items-center">
              <Button
                className="absolute left-[-20px] z-10 p-2 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-100 hidden md:block"
                onClick={() => scrollTours("left")}
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </Button>
              <div
                ref={tourListRef}
                className="flex overflow-x-auto scrollbar-hide space-x-5 py-2 px-1 snap-x snap-mandatory"
              >
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} onViewTour={handleViewTour} />
                ))}
              </div>
              <Button
                className="absolute right-[-20px] z-10 p-2 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-100 hidden md:block"
                onClick={() => scrollTours("right")}
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </Button>
            </div>
          )}
        </div>

        {/* Rate Guide in Dialog */}
        {canRateGuide && (
          <Dialog>
            <DialogTitle />
            <DialogTrigger asChild>
              <Button className="bg-neutral-200 text-gray-600 w-full hover:bg-white hover:border-1 hover:border-neutral-400 hover:text-black">
                Write your review here
              </Button>
            </DialogTrigger>

            <DialogContent className="w-full sm:max-w-[45rem] shadow-xl rounded-xl break-words">
              <DialogDescription />
              <Rate id={guideId} type="guide" onRated={handleRated} />
            </DialogContent>
          </Dialog>
        )}

        {/* Guide Reviews */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent reviews</h2>
            {!!reviews.length && (
              <span className="text-sm text-gray-500">
                {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">No reviews yet. Be the first to share your experience!</p>
          ) : (
            <RatingList ratings={reviews} type="guide" />
          )}
        </div>
      </div>
    </div>
  );
}
