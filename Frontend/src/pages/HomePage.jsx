import { useState, useEffect } from "react";
import { MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

import { Link } from "react-router-dom"; // Connect to ResultPage

// Images
// import heroBgImage from '../assets/homepage/hero-background.jpg';
import statsBgImage from '../assets/homepage/stats-background.jpg';
import guideApplyImage from '../assets/homepage/guide-apply.jpg';

// Base URL của API
const API_URL = 'http://127.0.0.1:8000/api';

// Mock data for demo
const destinations = [
  "Ha Long Bay",
  "Hoi An",
  "Phu Quoc",
  "Ho Chi Minh City",
  "Hanoi",
  "Da Nang",
  "Nha Trang",
  "Mekong Delta"
];

const popularTours = [
  {
    id: 1,
    title: "Ha Long Bay Cruise",
    location: "Ha Long Bay",
    price: 150,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=300&fit=crop",
    rating: 4.8
  },
  {
    id: 2,
    title: "Hoi An Ancient Town",
    location: "Hoi An",
    price: 80,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=300&fit=crop",
    rating: 4.9
  },
  {
    id: 3,
    title: "Mekong Delta Experience",
    location: "Mekong Delta",
    price: 95,
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=500&h=300&fit=crop",
    rating: 4.7
  }
];

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

function TravelStatsSection() {
  return (
    <section className="relative py-16 md:py-20 lg:py-24 bg-gray-100 overflow-hidden">
      {/* Background Image - Placeholder */}
      <img
        // src="https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1200&h=400&fit=crop&q=80"
        src={statsBgImage}
        alt="Vietnam landscape"
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-gray-100/40" />

      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto"> 
        {/* CHÚ Ý: 
          Bạn có thể dùng max-w-6xl (như các section khác) hoặc 
          max-w-4xl (như code cũ) tùy xem bạn muốn nó rộng bao nhiêu.
          Tui để max-w-6xl cho nhất quán.
        */}
          <div className="max-w-4xl mx-auto text-center"> 
            <p className="font-medium text-[#5A74F8] text-lg md:text-xl mb-3">
              Travel with us
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4">
              We're here to take you
            </h2>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-12">
              to the places you'll <span className="text-[#cc3737] font-light">love</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Stat 1 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-full p-4 shadow-md">
                <div className="flex items-center justify-between px-6">
                  <span className="text-lg font-medium text-gray-700">Travellers served</span>
                  <span className="text-xl font-bold text-black">10,000+</span>
                </div>
              </div>
              {/* Stat 2 */}
              <div className="bg-white/80 backdrop-blur-sm rounded-full p-4 shadow-md">
                <div className="flex items-center justify-between px-6">
                  <span className="text-lg font-medium text-gray-700">Tour guides</span>
                  <span className="text-xl font-bold text-black">500+</span>
                </div>
              </div>
            </div>
          </div>
        </div> 
      </div>
    </section>
  );
}

function BecomeGuideSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Application submitted:", formData);
    setIsOpen(false);
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      experience: "",
      message: ""
    });
  };

  return (
    // Thêm padding cho section và bọc content bên trong container
    <section className="py-16 md:py-20 lg:py-24 bg-gray-50/50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Thêm max-w-6xl, shadow, rounded và overflow-hidden để nhất quán */}
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Content Side */}
            <div className="flex-1 py-16 md:py-20 lg:py-28 px-6 md:px-12 lg:px-16 flex items-center justify-center md:justify-start">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="mb-6 text-black text-3xl md:text-4xl font-bold">Become a guide</h2>
                <p className="mb-8 text-black/55 leading-relaxed">
                  If you're ready to join a network of creative local tour guides who thrive on
                  providing visitors with truly memorable experiences, we'd love to hear from you
                </p>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <button className="bg-[#5A74F8] hover:bg-[#4a63d8] text-white px-6 py-3 rounded-xl transition-colors font-medium">
                      Apply now
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Apply to Become a Guide</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-left">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your.email@example.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+84 xxx xxx xxx"
                        />
                      </div>

                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          type="number"
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          placeholder="e.g., 5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="message">Tell us about yourself *</Label>
                        <Textarea
                          id="message"
                          required
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Share your passion for guiding and what makes you unique..."
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-[#5A74F8] hover:bg-[#4a63d8] text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Submit Application
                        </button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Image Side */}
            <div className="flex-1 relative min-h-[300px] md:min-h-full">
              <img
                // src="https://images.unsplash.com/photo-1543165796-5426273adab5?w=500&h=540&fit=crop"
                src={guideApplyImage}
                alt="Tour guide in Vietnam"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [destinations, setDestinations] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);

  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [guidesIndex, setGuidesIndex] = useState(0);
  const [reviewsIndex, setReviewsIndex] = useState(0);

  useEffect(() => {
    // 1. Fetch locations cho thanh tìm kiếm
    fetch(`${API_URL}/locations/`)
      .then(res => res.json())
      .then(data => {
        // API trả về list object, ta chỉ cần { id, name }
        // Giả sử PlaceSerializer trả về `fields = '__all__'`
        setDestinations(data.map(place => ({ id: place.id, name: place.name })));
      })
      .catch(err => console.error("Error fetching locations:", err));

    // 2. Fetch destinations cho mục "Popular dests"
    fetch(`${API_URL}/popular_destinations/`)
      .then(res => res.json())
      .then(data => {
        // API get_all_tours đã format data (image, location, title...)
        setPopularDestinations(data);
      })
      .catch(err => console.error("Error fetching popular destinations:", err));
  }, []); // đảm bảo chạy 1 lần

  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 3
  };

  const guidesMaxIndex = guides.length - itemsPerView.desktop;
  const reviewsMaxIndex = reviews.length - itemsPerView.desktop;

  const handleGuidesPrev = () => {
    setGuidesIndex((prev) => Math.max(0, prev - 1));
  };

  const handleGuidesNext = () => {
    setGuidesIndex((prev) => Math.min(guidesMaxIndex, prev + 1));
  };

  const handleReviewsPrev = () => {
    setReviewsIndex((prev) => Math.max(0, prev - 1));
  };

  const handleReviewsNext = () => {
    setReviewsIndex((prev) => Math.min(reviewsMaxIndex, prev + 1));
  };

  return (
    <div className="min-h-screen bg-white">
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[500px] md:min-h-[600px] lg:min-h-[660px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-100 to-blue-50">
          {/* Background image */}
          <img 
            src="https://6ixgo.com/_next/static/media/Banner.dd1e0ea6.svg?fbclid=IwY2xjawNzqBFleHRuA2FlbQIxMQABHoZRcRU5rejwr7vbckhvtLzAsQWbXN-PY_3Xo3KXl9XwlcknXI7651mx4gKJ_aem_E_758frw4cYczKIHiSZopA"
            alt="Hero background"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0">
            <div className="absolute inset-0 border border-black/10" />
          </div>

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
            <div className="max-w-4xl mx-auto text-center">
              {/* Hero Text */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 lg:mb-8 text-black">
                Take a friendlier route
              </h1>
              <p className="text-lg md:text-xl mb-8 md:mb-10 lg:mb-12 text-black/90 max-w-2xl mx-auto">
                Truly get to know Vietnam from people who know it best
              </p>

              {/* Search Bar */}
              <div className="bg-white rounded-full p-2 md:p-3 shadow-lg max-w-2xl mx-auto">
                <div className="flex flex-col md:flex-row gap-2 md:gap-0 md:divide-x divide-black/25">
                  {/* Location Selector */}
                  <div className="flex-1 px-3 md:px-4 py-2 md:py-0">
                    <div className="flex items-center gap-2 w-full">
                      <MapPin className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-black/60" />
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full border-0 outline-none bg-transparent text-sm"
                      >
                        <option value="">WHERE TO?</option>
                        {destinations.map((dest) => (
                          <option key={dest.id} value={dest.name}>{dest.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date Selector */}
                  <div className="flex-1 px-3 md:px-4 py-2 md:py-0">
                    <div className="flex items-center gap-2 w-full">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-black/60" />
                      <select
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full border-0 outline-none bg-transparent text-sm"
                      >
                        <option value="">SELECT DATE</option>
                        <option value="today">Today</option>
                        <option value="tomorrow">Tomorrow</option>
                        <option value="this-week">This Week</option>
                      </select>
                    </div>
                  </div>

                  {/* Search Button */}
                  <button
                    onClick={() => console.log("Search:", { location, date })}
                    className="bg-[#5A74F8] text-white px-6 py-3 rounded-full hover:bg-[#4a63d8] transition-colors font-medium"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="hidden md:inline">Search</span>
                      <span className="md:hidden">Go</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Destinations Section */}
        <section id="destinations" className="py-16 md:py-20 lg:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              {/* Icon and text */}
              <div className="text-center mb-12 md:mb-16">
                <div className="flex justify-center mb-4 md:mb-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-[#5A74F8] rounded-full flex items-center justify-center">
                    <span className="text-3xl md:text-4xl">🗺️</span>
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
                    to={`/tours?location=${encodeURIComponent(dest.name)}`} 
                    key={dest.id}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                      <div className="relative">
                        <img
                          src={dest.image} // Dùng ảnh đại diện từ API
                          alt={dest.name}
                          className="w-full h-64 object-cover" // Tăng chiều cao ảnh
                        />
                        {/* Hiển thị tên điểm đến trên ảnh */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <h3 className="absolute bottom-4 left-4 text-2xl font-semibold text-white">
                          {dest.name}
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

        {/* Guides Section */}
        <section id="guides" className="py-12 md:py-16 lg:py-20 bg-gray-50/50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12 lg:mb-16">
              <div className="flex justify-center mb-4 md:mb-6">
                {/* ĐỔI MÀU: Icon background */}
                <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-[#5A74F8] rounded-full flex items-center justify-center">
                  <span className="text-3xl md:text-4xl">👥</span>
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

        <TravelStatsSection />

        {/* Info Section */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose Us?
              </h2>
              <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
                Experience Vietnam with local guides who will make your journey unforgettable
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  {/* ĐỔI MÀU: Icon background */}
                  <div className="w-16 h-16 bg-[#5A74F8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="font-semibold mb-2">Local Experts</h3>
                  <p className="text-sm text-gray-600">
                    Connect with experienced local guides
                  </p>
                </div>
                <div className="text-center">
                  {/* ĐỔI MÀU: Icon background */}
                  <div className="w-16 h-16 bg-[#5A74F8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💝</span>
                  </div>
                  <h3 className="font-semibold mb-2">Personalized Tours</h3>
                  <p className="text-sm text-gray-600">
                    Customize your perfect journey
                  </p>
                </div>
                <div className="text-center">
                  {/* ĐỔI MÀU: Icon background */}
                  <div className="w-16 h-16 bg-[#5A74F8] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <h3 className="font-semibold mb-2">5 Star Rated</h3>
                  <p className="text-sm text-gray-600">
                    Verified by thousands of travelers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="py-12 md:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12 lg:mb-16">
              <div className="flex justify-center mb-4 md:mb-6">
                {/* ĐỔI MÀU: Icon background */}
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#5A74F8] rounded-full flex items-center justify-center">
                  <span className="text-3xl">💬</span>
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

        <BecomeGuideSection />

      </main>
    </div>
  );
}