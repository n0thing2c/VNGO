import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import ReviewIcon from "@/assets/homepage/review.png"

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
    return(
        <section id="reviews" className="py-16 md:py-20 lg:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12 lg:mb-16">
              <div className="flex justify-center mb-4 md:mb-6">
                {/* <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center">
                  <span className="text-5xl">💬</span>
                </div> */}
                <img
                  src={ReviewIcon}
                  alt="Review Icon"
                  className="w-8 md:w-12 lg:w-16 h-auto object-cover"
                />
              </div>
              <h2 className="text-vngo-primary text-3xl md:text-4xl font-bold text-black mb-2">What travellers say</h2>
            </div>
            
            <Carousel
              opts={{
                align: "start",
                loop: true, // Cho phép lặp vô tận
              }}
              className="w-full max-w-6xl mx-auto"
            >
              <CarouselContent className="-ml-4 md:-ml-6 lg:-ml-8">
                {reviews.map((review) => (
                  <CarouselItem
                    key={review.id}
                    className="pl-4 md:pl-6 lg:pl-8 basis-full md:basis-1/2 lg:basis-1/3"
                  >
                    <article
                      key={review.id}
                      className="flex-none border-t border-black/15 pt-6 h-full"
                    >
                      <h3 className="mb-4 text-lg font-semibold text-black">{review.title}</h3>
                      <p className="text-black/60 leading-relaxed">
                        {review.text}
                      </p>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
        </section>
    )
}