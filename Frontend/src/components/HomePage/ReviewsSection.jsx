import { useState } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";

// mock data
const reviews = [
  {
    id: 1,
    title: "Amazing Experience",
    text: "The tour was absolutely incredible! Our guide was knowledgeable and made the experience unforgettable. We got to see hidden places that aren't in guidebooks."
  },
  {
    id: 2,
    title: "Highly Recommended",
    text: "Best tour company in Vietnam. Everything was perfectly organized and the local insights were invaluable. Our guide spoke perfect English and was very patient."
  },
  {
    id: 3,
    title: "Fantastic Guides",
    text: "The guides were so friendly and knowledgeable. They really went above and beyond to make sure we had a great time and learned about Vietnamese culture."
  },
  {
    id: 4,
    title: "Perfect Trip",
    text: "Couldn't have asked for a better experience. The itinerary was well-planned and our guide was exceptional. Highly recommend to anyone visiting Vietnam."
  }
];

const itemsPerView = {
  mobile: 1,
  tablet: 2,
  desktop: 3
};

export default function ReviewsSection() {
    const [reviewsIndex, setReviewsIndex] = useState(0);
    const reviewsMaxIndex = reviews.length - itemsPerView.desktop;

    const handleReviewsPrev = () => {
        setReviewsIndex((prev) => Math.max(0, prev - 1));
    };

    const handleReviewsNext = () => {
        setReviewsIndex((prev) => Math.min(reviewsMaxIndex, prev + 1));
    };
    return(
        <section id="reviews" className="py-12 md:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12 lg:mb-16">
              <div className="flex justify-center mb-4 md:mb-6">
                {/* ĐỔI MÀU: Icon background */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center">
                  <span className="text-5xl">💬</span>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-2">What travellers say</h2>
            </div>

            <div className="relative">
              <div className="overflow-hidden">
                <div
                  className="flex gap-4 md:gap-6 lg:gap-8 transition-transform duration-300 ease-in-out"
                  style={{
                    transform: `translateX(-${reviewsIndex * (100 / itemsPerView.desktop + 2.67)}%)`
                  }}
                >
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="flex-none w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-21.33px)] border-t border-black/15 pt-6"
                    >
                      <h3 className="mb-4 text-lg font-semibold text-black">{review.title}</h3>
                      <p className="text-black/60 leading-relaxed">
                        {review.text}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-center md:justify-between items-center mt-8 md:mt-10 gap-4 md:absolute md:top-1/2 md:-translate-y-1/2 md:left-0 md:right-0 md:pointer-events-none">
                <button
                  onClick={handleReviewsPrev}
                  disabled={reviewsIndex === 0}
                  className="bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 shadow-md transition-all md:pointer-events-auto md:-translate-x-4 lg:-translate-x-6"
                  aria-label="Previous reviews"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleReviewsNext}
                  disabled={reviewsIndex >= reviewsMaxIndex}
                  className="bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 shadow-md transition-all md:pointer-events-auto md:translate-x-4 lg:translate-x-6"
                  aria-label="Next reviews"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </section>
    )
}