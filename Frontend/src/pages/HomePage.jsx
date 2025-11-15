import { useState, useEffect } from "react";

import HeroSection from "@/components/HomePage/HeroSection";
import PopularDestSection from "@/components/HomePage/PopularDestSection";
import GuidesSection from "@/components/HomePage/GuidesSection";
import TravelStatsSection from "@/components/HomePage/TravelStatsSection";
import InfoSection from "@/components/HomePage/InfoSection";
import ReviewsSection from "@/components/HomePage/ReviewsSection";
import BecomeGuideSection from "@/components/HomePage/BecomeGuideSection"
import FadeInWrapper from "@/components/FadeInWrapper";

// API
import { API_ENDPOINTS } from "@/constant";

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

export default function HomePage() {
  const [popularDestinations, setPopularDestinations] = useState([]);

  useEffect(() => {
    // Fetch destinations cho mục "Popular dests"
    fetch(API_ENDPOINTS.GET_POPULAR_DESTINATIONS)
      .then(res => res.json())
      .then(data => {
        // API get_all_tours đã format data (image, location, title...)
        setPopularDestinations(data);
      })
      .catch(err => console.error("Error fetching popular destinations:", err));
  }, []); // đảm bảo chạy 1 lần

  return (
    <div className="min-h-screen bg-white">
      <main>
        <HeroSection />
        <FadeInWrapper><PopularDestSection popularDestinations={popularDestinations}/></FadeInWrapper>
        <FadeInWrapper><GuidesSection /></FadeInWrapper>
        <FadeInWrapper><TravelStatsSection /></FadeInWrapper>
        <FadeInWrapper><InfoSection /></FadeInWrapper>
        <FadeInWrapper><ReviewsSection /></FadeInWrapper>
        <FadeInWrapper><BecomeGuideSection /></FadeInWrapper>
      </main>
    </div>
  );
}