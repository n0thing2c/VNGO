import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

// mock data
const guides = [
  {
    id: 1,
    name: "Tran Cong Hoang Tan",
    description: "A passionate explorer who loves sharing hidden gems with travelers. Tan enjoys connecting cultures and making every trip memorable.",
    image: "https://images.unsplash.com/photo-1597890928584-23b06b3af251?w=500&h=400&fit=crop"
  },
  {
    id: 2,
    name: "Huynh Thi Gia Khang",
    description: "A cheerful tour guide who knows Vietnam's history inside out. Khang specializes in cultural tours and brings every story to life.",
    image: "https://images.unsplash.com/photo-1752136805352-e4c851d55893?w=500&h=400&fit=crop"
  },
  {
    id: 3,
    name: "Truong Thi Tan Dung",
    description: "A friendly and energetic local guide who loves outdoor adventures and helping visitors experience authentic Vietnamese life.",
    image: "https://images.unsplash.com/photo-1590501753466-eef7148bcdf5?w=500&h=400&fit=crop"
  },
  {
    id: 4,
    name: "Nguyen Van Minh",
    description: "Expert in food tours and culinary experiences, Minh will take you to the best local eateries and street food spots.",
    image: "https://images.unsplash.com/photo-1741243412269-be61e7d2be0d?w=500&h=400&fit=crop"
  }
];

const itemsPerView = {
  mobile: 1,
  tablet: 2,
  desktop: 3
};

export default function GuidesSection() {
    return(
        <section id="guides" className="py-12 md:py-16 lg:py-20 bg-gray-50/50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12 lg:mb-16">
              <div className="flex justify-center mb-4 md:mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center">
                  <span className="text-3xl md:text-5xl">👥</span>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-2">Meet your local guides</h2>
            </div>

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-6xl mx-auto" // Giới hạn độ rộng
            >
              <CarouselContent className="-ml-4 md:-ml-6 lg:-ml-8">
                {guides.map((guide) => (
                  <CarouselItem
                    key={guide.id}
                    // Tailwind lo hết responsive: 1 cột, 2 cột, 3 cột
                    className="pl-4 md:pl-6 lg:pl-8 basis-full md:basis-1/2 lg:basis-1/3"
                  >
                    <div
                      key={guide.id}
                      className="flex-none bg-white rounded-xl overflow-hidden shadow-sm border border-black/10 h-full"
                    >
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img
                          src={guide.image}
                          alt={guide.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5 md:p-6">
                        <h3 className="mb-2 text-lg font-semibold text-black">{guide.name}</h3>
                        <p className="text-black/60 mb-6 line-clamp-3 text-sm">
                          {guide.description}
                        </p>
                        {/* ĐỔI MÀU: Nút message hover */}
                        <button className="text-black hover:text-[#5A74F8] transition-colors flex items-center gap-1 text-sm font-medium">
                          <span>Message</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Nút điều hướng tự động của shadcn */}
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
        </section>
    )
}