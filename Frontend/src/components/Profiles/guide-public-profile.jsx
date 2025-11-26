// GuidePublicProfile.jsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom'; // Hoặc dùng hook của Next.js nếu bạn dùng Next
import { ChevronLeft, ChevronRight, MapPin, Globe, Star } from 'lucide-react';
import { toast } from "sonner";

// Import Services
import { tourService } from "@/services/tourService";
import { profileService } from "@/services/profileService";

// Import Components của bạn
import RatingList from "@/components/rating/ratings";
import Rate from "@/components/rating/rate.jsx";

// Component Button nhỏ
const Button = ({ children, className, onClick, ...props }) => (
  <button className={`p-2 rounded-lg transition-colors ${className}`} onClick={onClick} {...props}>
    {children}
  </button>
);

// Component TourCard (Cần điều chỉnh field data cho khớp với API trả về)
const TourCard = ({ id, name, description, images, price }) => {
  // Lấy ảnh đầu tiên hoặc placeholder
  const thumbnail = images && images.length > 0 ? images[0].image : "https://placehold.co/150x100?text=No+Image";

  return (
    <div className="min-w-[200px] w-[200px] bg-white rounded-lg overflow-hidden shadow-md transition-shadow hover:shadow-lg border border-gray-100 flex-shrink-0">
      <img
        src={thumbnail}
        alt={name}
        className="h-28 w-full object-cover"
      />
      <div className="p-3">
        <h4 className="font-semibold text-sm truncate">{name}</h4>
        <p className="text-xs text-blue-600 font-bold mt-1">${price}</p>
        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
          {description || "No description available"}
        </p>
      </div>
    </div>
  );
};

export function GuidePublicProfile() {
  // Lấy ID guide từ URL
  const { id } = useParams();

  // State quản lý dữ liệu
  const [guide, setGuide] = useState(null);
  const [tours, setTours] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const tourListRef = useRef(null);

  // Fetch dữ liệu khi component load hoặc ID thay đổi
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Gọi song song 3 API để tiết kiệm thời gian
        const [guideRes, toursRes, ratingsRes] = await Promise.all([
          profileService.getGuideProfile(id),
          tourService.getAllToursByGuide(id),
          profileService.getGuideRatings(id)
        ]);

        if (guideRes.success) setGuide(guideRes.data);
        if (toursRes.success) setTours(toursRes.data);
        if (ratingsRes.success) setRatings(ratingsRes.data);

      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Could not load guide profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Xử lý scroll ngang cho list tour
  const scrollTours = (direction) => {
    if (tourListRef.current) {
      const scrollAmount = 220;
      tourListRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Callback khi user đánh giá xong -> reload lại list rating
  const handleRateSuccess = (newRating) => {
    // Cách đơn giản: thêm rating mới vào đầu list hoặc fetch lại API
    setRatings((prev) => [newRating, ...prev]);
    // Cập nhật lại điểm trung bình cho guide nếu cần (phức tạp hơn xíu ở frontend)
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!guide) return <div className="min-h-screen flex items-center justify-center">Guide not found</div>;

  // Tính toán hiển thị ngôn ngữ
  const displayLanguages = Array.isArray(guide.languages) ? guide.languages.join(", ") : guide.languages;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-[92%] md:max-w-4xl pt-8 pb-12">

        {/* --- Profile Header Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">

          {/* Left Column: Avatar & Info */}
          <div className="md:col-span-1 flex flex-col items-center md:items-start space-y-3 border-b md:border-b-0 md:border-r border-gray-200 md:pr-6 pb-4 md:pb-0">
            <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-white ring-2 ring-gray-300 shadow-md">
              <img
                src={guide.face_image || "https://placehold.co/112x112?text=Avatar"}
                alt={guide.name}
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-2">{guide.name}</h1>

            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1 text-red-500" />
              <span>{guide.location || "Vietnam"}</span>
            </div>

            <div className="flex items-center text-gray-600 text-sm">
              <Globe className="w-4 h-4 mr-1 text-blue-500" />
              <span>{displayLanguages || "English"}</span>
            </div>

            <div className="flex items-center pt-1">
              {/* Hiển thị số sao trung bình */}
              <div className="flex text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-sm font-bold ml-1">
                {guide.rating_count > 0 ? (guide.rating_total / guide.rating_count).toFixed(1) : 0}
              </span>
              <span className="text-sm text-gray-500 ml-1">({guide.rating_count} reviews)</span>
            </div>
          </div>

          {/* Right Column: Bio */}
          <div className="md:col-span-2 md:pl-6">
            <h2 className="text-lg font-semibold text-blue-600 mb-3">About me</h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              {guide.bio || "This guide hasn't written a bio yet."}
            </p>
          </div>
        </div>

        {/* --- Tours Section (Gọi từ tourService) --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tours ({tours.length})</h2>

          {tours.length > 0 ? (
            <div className="relative flex items-center group">
              <Button
                className="absolute left-[-20px] z-10 bg-white shadow-lg border border-gray-200 hover:bg-gray-100 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => scrollTours('left')}
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </Button>

              <div
                ref={tourListRef}
                className="flex overflow-x-auto scrollbar-hide space-x-5 py-2 px-1 snap-x snap-mandatory scroll-smooth"
              >
                {tours.map((tour) => (
                  // Truyền props khớp với data tour từ backend
                  <TourCard key={tour.id} {...tour} />
                ))}
              </div>

              <Button
                className="absolute right-[-20px] z-10 bg-white shadow-lg border border-gray-200 hover:bg-gray-100 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => scrollTours('right')}
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </Button>
            </div>
          ) : (
            <p className="text-gray-500 italic">No tours available yet.</p>
          )}
        </div>

        {/* --- Reviews Section --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-8">

          {/* Form để Tourist đánh giá Guide */}
          {/* Sử dụng component Rate.jsx của bạn */}
          <div className="border-b border-gray-200 pb-6">
            <Rate
              id={id}         // Guide ID
              type="guide"    // Quan trọng: Prop này báo cho Rate.jsx dùng profileService
              onRated={handleRateSuccess}
            />
          </div>

          {/* Danh sách đánh giá */}
          {/* Sử dụng component RatingList (từ rating.jsx) của bạn */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews</h2>
            <RatingList
              ratings={ratings}
              type="guide"    // Quan trọng: Prop này báo cho RatingList dùng GUIDE_TAG_VARIANTS
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default GuidePublicProfile;