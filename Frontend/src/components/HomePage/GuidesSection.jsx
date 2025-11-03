import { useState } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    const [guidesIndex, setGuidesIndex] = useState(0);
    const guidesMaxIndex = guides.length - itemsPerView.desktop;

    const handleGuidesPrev = () => {
        setGuidesIndex((prev) => Math.max(0, prev - 1));
    };

    const handleGuidesNext = () => {
        setGuidesIndex((prev) => Math.min(guidesMaxIndex, prev + 1));
    };
    return(
        <section id="guides" className="py-12 md:py-16 lg:py-20 bg-gray-50/50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12 lg:mb-16">
              <div className="flex justify-center mb-4 md:mb-6">
                {/* ĐỔI MÀU: Icon background */}
                <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center">
                  <span className="text-3xl md:text-5xl">👥</span>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-2">Meet your local guides</h2>
            </div>

            <div className="relative">
              <div className="overflow-hidden">
                <div
                  className="flex gap-4 md:gap-6 lg:gap-8 transition-transform duration-300 ease-in-out"
                  style={{
                    transform: `translateX(-${guidesIndex * (100 / itemsPerView.desktop + 2.67)}%)`
                  }}
                >
                  {guides.map((guide) => (
                    <div
                      key={guide.id}
                      className="flex-none w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-21.33px)] bg-white rounded-xl overflow-hidden shadow-sm border border-black/10"
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
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-center md:justify-between items-center mt-6 md:mt-8 gap-4 md:absolute md:top-1/2 md:-translate-y-1/2 md:left-0 md:right-0 md:pointer-events-none">
                <button
                  onClick={handleGuidesPrev}
                  disabled={guidesIndex === 0}
                  className="bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 shadow-md transition-all md:pointer-events-auto md:-translate-x-4 lg:-translate-x-6"
                  aria-label="Previous guides"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleGuidesNext}
                  disabled={guidesIndex >= guidesMaxIndex}
                  className="bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 shadow-md transition-all md:pointer-events-auto md:translate-x-4 lg:translate-x-6"
                  aria-label="Next guides"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </section>
    )
}