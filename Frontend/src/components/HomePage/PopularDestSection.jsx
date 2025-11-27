import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

export default function PopularDestSection({ popularDestinations = [] }) {
  return (
    <section id="destinations" className="py-16 md:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Icon and text */}
          <div className="text-center mb-12 md:mb-16">
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center">
                <span className="text-3xl md:text-5xl">🗺️</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              Popular Destinations
            </h2>
            <p className="text-center text-gray-600 max-w-2xl mx-auto">
              Discover the most beautiful places in Vietnam
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Lấy 3 hoặc 6 điểm đến đầu tiên (API trả về 6 */}
            {popularDestinations.slice(0, 3).map((dest) => (
              // Bọc Card bằng Link, trỏ đến trang /tours
              <Link
                to={`/tours?location=${encodeURIComponent(dest.name_en)}`}
                key={dest.id}
              >
                <div className="group h-full overflow-hidden border-0 shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl rounded-2xl cursor-pointer bg-white flex flex-col">
                  {/* Full width image - no gap at top */}
                  <div className="relative h-72 overflow-hidden flex-shrink-0">
                    <img
                      src={dest.image}
                      alt={dest.name_en.split(",")[0]}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Gradient overlay: Làm tối dần để chữ dễ đọc hơn */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                    
                    <h3 className="absolute bottom-5 left-6 text-3xl font-bold text-white tracking-wide drop-shadow-md">
                      {dest.name_en.split(",")[0]}
                    </h3>
                  </div>

                  <div className="p-6 bg-white relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600 group-hover:text-blue-600 transition-colors duration-300">
                        <MapPin className="w-5 h-5 mr-2" />
                        <span className="font-medium text-base">
                          {dest.tour_count}{" "}
                          {dest.tour_count > 1 ? "tours" : "tour"} available
                        </span>
                      </div>
                      
                      <span className="text-gray-300 group-hover:text-blue-500 transition-colors duration-300">
                        ➔
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
