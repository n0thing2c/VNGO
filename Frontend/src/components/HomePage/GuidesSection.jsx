import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_ENDPOINTS, ROUTES } from "@/constant";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import GuideIcon from "@/assets/homepage/guideicon.png"

export default function GuidesSection() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_ENDPOINTS.GET_HOMEPAGE_GUIDES)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGuides(data.guides);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching guides:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return null;

  return (
    <section id="guides" className="py-12 md:py-16 lg:py-20 bg-gray-50/50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <div className="flex justify-center mb-4 md:mb-6">
            {/* <div className="w-8 md:w-12 lg:w-16  rounded-full flex items-center justify-center">
                  <span className="text-3xl md:text-5xl">👥</span>
                </div> */}
            <img
              src={GuideIcon}
              alt="Guides Icon"
              className="w-8 md:w-12 lg:w-16 h-auto object-cover"
            />
          </div>
          <h2 className="text-vngo-primary text-3xl md:text-4xl font-bold text-black mb-2">Meet your local guides</h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto">
            Connect with our top-rated local experts
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
            {guides.map((guide) => (
              <CarouselItem
                key={guide.id}
                // Tailwind handles all responsive: 1 column, 2 columns, 3 columns
                className="pl-4 md:pl-6 lg:pl-8 basis-full md:basis-1/2 lg:basis-1/3"
              >
                <div
                  className="flex-none bg-white rounded-xl overflow-hidden shadow-sm border border-black/10 h-full transition-transform hover:-translate-y-1 duration-300"
                >
                  <Link to={ROUTES.PUBLIC_PROFILE(guide.id)} className="block h-full">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={guide.image}
                        alt={guide.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 md:p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-black hover:text-[#5A74F8] transition-colors">{guide.name}</h3>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-bold text-yellow-700">{guide.rating}</span>
                          <span className="text-[10px] text-gray-400">({guide.reviews})</span>
                        </div>
                      </div>
                      <p className="text-black/60 mb-6 line-clamp-3 text-sm">
                        {guide.description}
                      </p>
                      <div className="text-black group-hover:text-[#5A74F8] transition-colors flex items-center gap-1 text-sm font-medium">
                        <span>View Profile</span>
                        <span>→</span>
                      </div>
                    </div>
                  </Link>
                </div>
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