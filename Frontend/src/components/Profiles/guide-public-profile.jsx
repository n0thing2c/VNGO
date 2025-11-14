import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Globe, Star } from 'lucide-react';

// Assuming these are globally available or properly imported elsewhere in your project
// Since the exact path is internal, we are defining mock components for safe compilation
// If you want to use the actual components, you need to ensure their correct imports here.
const Button = ({ children, className, onClick, ...props }) => (
  <button className={`p-2 rounded-lg transition-colors ${className}`} onClick={onClick} {...props}>
    {children}
  </button>
);

// --- MOCK DATA ---
const mockGuideData = {
  name: "Nguyen Le My",
  location: "Phu Quoc, Vietnam",
  languages: "Eng, China, Viet",
  rating: 5,
  bio: "Hi! I'm My. Your private guide in Phu Quoc. Quisque finibus ex sapien, ut consectetur adipiscing elit. Quisque tincidunt ex sapien, ut consectetur adipiscing elit. In id cursus mi pretium tellus duis convallis. Tempus leo eu laoreet, eros nunc ut laoreet. Pulvinar varius fringilla lacus nec metus bibendum egestas iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ut hendrerit semper vel class aptent taciti sociosqu.",
  profilePictureUrl: "https://placehold.co/112x112/A0A0A0/ffffff?text=My",
  tours: [
    { title: "Phu Quoc Island", description: "Phu Quoc is a tropical paradise with crystal clear water.", image: "https://placehold.co/150x100/4F68C4/ffffff?text=Island+Tour" },
    { title: "Ben Thanh market", description: "The market is one of the earliest surviving buildings in Ho Chi Minh City and an important symbol of the city.", image: "https://placehold.co/150x100/F5A737/ffffff?text=Market+Tour" },
    { title: "Ha Long Bay", description: "A UNESCO World Heritage site is internationally renown knows for its emerald waters.", image: "https://placehold.co/150x100/2A8A55/ffffff?text=Bay+Tour" },
    { title: "Hoi An Ancient Town", description: "A beautifully preserved trading port, famous for its lantern-lit streets.", image: "https://placehold.co/150x100/C44F4F/ffffff?text=Hoi+An" },
  ],
  reviews: [
    { user: "Wanda Wingleton", date: "October 2025", rating: 4, text: "I was completely taken by the exceptional naming power and attention to detail from this service. I wanted to find a way to get attention for my creatures of great wonder and beauty in this world's great garden, and Namedly delivered." },
    { user: "Wanda Wingleton", date: "October 2025", rating: 4.5, text: "I was completely taken by the exceptional naming power and attention to detail from this service. I wanted to find a way to get attention for my creatures of great wonder and beauty in this world's great garden, and Namedly delivered." },
    { user: "Wanda Wingleton", date: "October 2025", rating: 3.5, text: "I was completely taken by the exceptional naming power and attention to detail from this service. I wanted to find a way to get attention for my creatures of great wonder and beauty in this world's great garden, and Namedly delivered." },
  ]
};

// Helper function to render star rating
const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const stars = [];
  for (let i = 0; i < 5; i++) {
    let fill = "text-gray-300";
    if (i < fullStars) {
      fill = "text-yellow-400"; // Full star
    } else if (i === fullStars && (rating % 1) >= 0.5) {
      // Use a custom icon or technique for half star if needed,
      // but for simplicity here, we'll use a full star color approximation
      fill = "text-yellow-400";
    }
    stars.push(<Star key={i} className={`w-4 h-4 fill-current ${fill}`} />);
  }
  return (
    <div className="flex items-center space-x-0.5">
      {stars}
    </div>
  );
};

// Component for a single Tour Card
const TourCard = ({ title, description, image }) => (
  <div className="min-w-[200px] w-[200px] bg-white rounded-lg overflow-hidden shadow-md transition-shadow hover:shadow-lg border border-gray-100">
    <img
      src={image}
      alt={title}
      className="h-28 w-full object-cover"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "https://placehold.co/150x100/4F68C4/ffffff?text=Tour+Image";
      }}
    />
    <div className="p-3">
      <h4 className="font-semibold text-sm truncate">{title}</h4>
      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{description}</p>
    </div>
  </div>
);

// Component for a single Review Card
const ReviewCard = ({ user, date, rating, text }) => (
  <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:mb-0">
    <div className="flex justify-between items-start">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
          {user.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-sm">{user}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      </div>
      <StarRating rating={rating} />
    </div>
    <p className="text-sm text-gray-700 mt-2">{text}</p>
  </div>
);


export function GuidePublicProfile() {
  const { name, location, languages, rating, bio, profilePictureUrl, tours, reviews } = mockGuideData;

  const tourListRef = useRef(null);

  const scrollTours = (direction) => {
    if (tourListRef.current) {
      const scrollAmount = 220; // TourCard width + margin (approx)
      tourListRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };


  return (
    // Outer container with neutral background
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-[92%] md:max-w-4xl pt-8 pb-12">

        {/* --- Profile Header Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">

          {/* Left Column: Picture and Info */}
          <div className="md:col-span-1 flex flex-col items-center md:items-start space-y-3 border-b md:border-b-0 md:border-r border-gray-200 md:pr-6 pb-4 md:pb-0">
            <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-white ring-2 ring-gray-300 shadow-md">
              <img
                src={profilePictureUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-2">{name}</h1>

            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1 text-red-500" />
              <span>{location}</span>
            </div>

            <div className="flex items-center text-gray-600 text-sm">
              <Globe className="w-4 h-4 mr-1 text-blue-500" />
              <span>{languages}</span>
            </div>

            <div className="flex items-center pt-1">
              <StarRating rating={rating} />
              <span className="text-sm text-gray-600 ml-2">({rating.toFixed(1)})</span>
            </div>

          </div>

          {/* Right Column: About Me */}
          <div className="md:col-span-2 md:pl-6">
            <h2 className="text-lg font-semibold text-blue-600 mb-3">About me</h2>
            <p className="text-gray-700 leading-relaxed text-sm">{bio}</p>
          </div>
        </div>

        {/* --- Tours Section --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tours ({tours.length})</h2>

          <div className="relative flex items-center">

            {/* Scroll Button Left */}
            <Button
              className="absolute left-[-20px] z-10 p-2 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-100 hidden md:block"
              onClick={() => scrollTours('left')}
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </Button>

            {/* Tour Cards Scroller */}
            <div
              ref={tourListRef}
              // Added snap-x and scrollbar-hide for better scroll experience
              className="flex overflow-x-scroll scrollbar-hide space-x-5 py-2 px-1 snap-x snap-mandatory"
            >
              {tours.map((tour, index) => (
                <TourCard key={index} {...tour} />
              ))}
            </div>

            {/* Scroll Button Right */}
            <Button
              className="absolute right-[-20px] z-10 p-2 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-100 hidden md:block"
              onClick={() => scrollTours('right')}
              aria-label="Scroll Right"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </Button>
          </div>
        </div>

        {/* --- Reviews Section --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews</h2>

          <div className="space-y-4">
            {reviews.map((review, index) => (
              <ReviewCard key={index} {...review} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center space-x-4 text-sm mt-6">
            <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold">Prev</a>
            <span className="font-bold text-blue-600">1</span>
            <a href="#" className="text-gray-600 hover:text-blue-600">2</a>
            <a href="#" className="text-gray-600 hover:text-blue-600">3</a>
            <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold">Next</a>
          </div>
        </div>
      </div>
    </div>
  );
}