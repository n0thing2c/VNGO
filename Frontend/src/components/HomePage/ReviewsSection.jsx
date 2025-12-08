import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import ReviewIcon from "@/assets/homepage/review.png"
import { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/constant";

const ReviewCard = ({ review }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 200;
  const isLong = review.text.length > maxLength;

  return (
    <article className="flex flex-col h-full bg-slate-50 p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={review.tourist_image}
          alt={review.tourist_name}
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + review.tourist_name; }}
        />
        <div>
          <h4 className="font-semibold text-black text-lg leading-tight">{review.tourist_name}</h4>
          <div className="flex items-center text-yellow-400 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < review.rating ? "currentColor" : "none"}
                strokeWidth={2}
                className={i < review.rating ? "text-yellow-400" : "text-gray-300"}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="text-black/70 leading-relaxed mb-4 flex-grow italic">
        "
        {isExpanded || !isLong ? review.text : `${review.text.slice(0, maxLength)}...`}
        "
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 text-vngo-primary font-medium hover:underline focus:outline-none text-sm not-italic"
          >
            {isExpanded ? "See less" : "See more"}
          </button>
        )}
      </div>

      <div className="pt-4 border-t border-slate-200 mt-auto">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Booked Tour</p>
        <p className="text-vngo-primary font-medium truncate" title={review.tour_name}>
          {review.tour_name}
        </p>
      </div>
    </article>
  );
};

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.GET_TOP_REVIEWS);
        if (response.data.success) {
          setReviews(response.data.reviews);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return <div className="py-20 text-center">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return null; // Or show a default message
  }

  return (
    <section id="reviews" className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <div className="flex justify-center mb-4 md:mb-6">
            <img
              src={ReviewIcon}
              alt="Review Icon"
              className="w-8 md:w-12 lg:w-16 h-auto object-cover"
            />
          </div>
          <h2 className="text-vngo-primary text-3xl md:text-4xl font-bold text-black mb-2">What travellers say</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto">
            See what our travelers are saying
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-4 md:-ml-6 lg:-ml-8">
            {reviews.map((review) => (
              <CarouselItem
                key={review.id}
                className="pl-4 md:pl-6 lg:pl-8 basis-full md:basis-1/2 lg:basis-1/3"
              >
                <ReviewCard review={review} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 lg:-left-16 border-2 border-vngo-primary text-vngo-primary hover:bg-vngo-primary hover:text-white transition-colors" />
          <CarouselNext className="hidden md:flex -right-12 lg:-right-16 border-2 border-vngo-primary text-vngo-primary hover:bg-vngo-primary hover:text-white transition-colors" />
        </Carousel>
      </div>
    </section>
  )
}