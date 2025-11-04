import { Link } from "react-router-dom";
import { Card, CardContent } from '../ui/card';
import { MapPin } from "lucide-react";

export default function PopularDestSection( {popularDestinations} ){
    return(
        <section id="destinations" className="py-16 md:py-20 lg:py-24 bg-white">
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Icon and text */}
                    <div className="text-center mb-12 md:mb-16">
                    <div className="flex justify-center mb-4 md:mb-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center">
                        <span className="text-3xl md:text-5xl">🗺️</span>
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Popular Destinations</h2>
                    <p className="text-center text-gray-600 max-w-2xl mx-auto">
                        Discover the most beautiful places in Vietnam
                    </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Lấy 3 hoặc 6 điểm đến đầu tiên (API trả về 6 */}
                    {popularDestinations.slice(0, 3).map((dest) => (

                        // Bọc Card bằng Link, trỏ đến trang /tours
                        <Link
                        to={`/tours?location=${encodeURIComponent(dest.name_en.split(',')[0])}`}
                        key={dest.id}
                        >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                            <div className="relative">
                            <img
                                src={dest.image} // Dùng ảnh đại diện từ API
                                alt={dest.name_en.split(',')[0]}
                                className="w-full h-64 object-cover" // Tăng chiều cao ảnh
                            />
                            {/* Hiển thị tên điểm đến trên ảnh */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <h3 className="absolute bottom-4 left-4 text-2xl font-semibold text-white">
                                {dest.name_en.split(',')[0]}
                            </h3>
                            </div>
                            <CardContent className="p-4">
                            {/* Thông tin phụ: có bao nhiêu tour */}
                            <div className="flex items-center text-gray-600">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span className="text-sm">
                                {dest.tour_count} {dest.tour_count > 1 ? 'tours' : 'tour'} available
                                </span>
                            </div>
                            </CardContent>
                        </Card>
                        </Link>
                    ))}
                    </div>
                </div>
            </div>
        </section>
    )
}