import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Users, Sparkles, TrendingUp } from "lucide-react";
import { tripPlannerService } from "@/services/tripPlannerService";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Skeleton loader for tour cards
const TourCardSkeleton = () => (
  <div className="rounded-xl bg-white shadow-sm border border-black/10 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-6 bg-gray-200 rounded w-1/3" />
    </div>
  </div>
);

// Tour card component for recommendations
const RecommendedTourCard = ({ tour }) => {
  const rating = tour.rating_count > 0 
    ? (tour.rating_total / tour.rating_count).toFixed(1) 
    : 0;
  
  const renderStars = () => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < fullStars || (i === fullStars && hasHalf) 
              ? "fill-amber-400 text-amber-400" 
              : "fill-gray-200 text-gray-200"}
          />
        ))}
      </div>
    );
  };

  return (
    <Link 
      to={`/tour/post/${tour.id}`}
      className="block rounded-xl bg-white shadow-sm border border-black/10 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={tour.thumbnail || "https://placehold.co/400x300/60a5fa/ffffff?text=Tour"}
          alt={tour.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = 'https://placehold.co/400x300/60a5fa/ffffff?text=Tour'; 
          }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Recommendation badge */}
        {tour.recommendation_score > 0 && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-[#020765] to-[#23c491] text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <Sparkles size={12} />
            <span>{Math.round(tour.recommendation_score * 100)}% match</span>
          </div>
        )}
        
        {/* Price badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-gray-900 font-bold px-3 py-1.5 rounded-lg shadow-md">
          ${(tour.price / 25000).toFixed(0)}
          <span className="text-xs font-normal text-gray-500">/person</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-1 hover:text-[#020765] transition-colors">
          {tour.name}
        </h3>
        
        {/* Rating & Reviews */}
        <div className="flex items-center gap-2 mb-3">
          {renderStars()}
          <span className="text-sm text-gray-600">
            {rating} ({tour.rating_count || 0})
          </span>
        </div>
        
        {/* Tags */}
        {tour.tags && tour.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tour.tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx}
                className="text-xs bg-[#23c491]/10 text-[#020765] px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Duration & Group size */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{tour.duration}h</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{tour.min_people}-{tour.max_people}</span>
          </div>
        </div>
        
        {/* Recommendation reasons */}
        {tour.recommendation_reasons && tour.recommendation_reasons.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-[#020765] font-medium flex items-center gap-1">
              <TrendingUp size={12} />
              {tour.recommendation_reasons[0]}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};

export default function RecommendedToursSection() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await tripPlannerService.getRecommendations({
          limit: 9, // Get more for carousel
        });

        if (result.success && result.data?.recommendations) {
          setTours(result.data.recommendations);
        } else {
          setError("Could not load recommendations");
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Could not load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  // Don't show section if user not logged in
  if (!user) {
    return null;
  }

  // Don't show if error and no tours
  if (error && tours.length === 0) {
    return null;
  }

  // Don't show if loading finished and no tours
  if (!loading && tours.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-[#23c491]/10 to-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="w-12 md:w-16 h-12 md:h-16 rounded-full bg-gradient-to-r from-[#020765] to-[#23c491] flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 md:w-8 h-6 md:h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2 text-[#020765]">
            Recommended For You
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Personalized tour suggestions based on your preferences
          </p>
        </div>

        {/* Tour Carousel */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <TourCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
              dragFree: true,
            }}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent className="-ml-4 md:-ml-6 lg:-ml-8">
              {tours.map((tour) => (
                <CarouselItem
                  key={tour.id}
                  className="pl-4 md:pl-6 lg:pl-8 basis-[85%] sm:basis-[70%] md:basis-1/2 lg:basis-1/3"
                >
                  <RecommendedTourCard tour={tour} />
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious className="hidden md:flex -left-12 lg:-left-16 border-2 border-[#020765] text-[#020765] hover:bg-[#020765] hover:text-white transition-colors" />
            <CarouselNext className="hidden md:flex -right-12 lg:-right-16 border-2 border-[#020765] text-[#020765] hover:bg-[#020765] hover:text-white transition-colors" />
          </Carousel>
        )}
        
        {/* CTA Button */}
        <div className="text-center mt-10">
          <Link
            to="/trip-planner"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#020765] to-[#23c491] text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            <span>Plan Your Trip with AI</span>
            <Sparkles size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
