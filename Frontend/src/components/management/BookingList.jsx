import BookingCard from "./BookingCard";
import BookingCardSkeleton from "./BookingCardSkeleton";
import EmptyBookingState from "./EmptyBookingState";
import { useState, useEffect } from "react";

const mockData = [
    {
        id: 1,
        title: "Phu Quoc Island",
        guideName: "My",
        status: "Accepted",
        image: "https://images.unsplash.com/photo-1577717906932-1f9cde8e1255?w=800&auto=format&fit=crop",
    },
    {
        id: 2,
        title: "Ben Thanh Market",
        guideName: "Binkintin",
        status: "Pending",
        image: "https://images.unsplash.com/photo-1583417319079-2898e5d3c5e9?w=800&auto=format&fit=crop",
    },
    {
        id: 3,
        title: "Ha Long Bay",
        guideName: "Khanh Huynh",
        status: "Pending",
        image: "https://images.unsplash.com/photo-1506905925346-5006b989a7e2?w=800&auto=format&fit=crop",
    },
    {
        id: 4,
        title: "Da Lat Flower Garden",
        guideName: "Lan Anh",
        status: "Accepted",
        image: "https://images.unsplash.com/photo-1540979384820-2b1f3f31b44f?w=800&auto=format&fit=crop",
    },
    {
        id: 5,
        title: "Hoi An Ancient Town",
        guideName: "Trung",
        status: "Accepted",
        image: "https://images.unsplash.com/photo-1555400035847-742d343f2cb9?w=800&auto=format&fit=crop",
    },
    {
        id: 6,
        title: "Mui Ne Sand Dunes",
        guideName: "Phong",
        status: "Pending",
        image: "https://images.unsplash.com/photo-1583417319079-2898e5d3c5e9?w=800&auto=format&fit=crop",
    },
];

export default function BookingList() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) return <LoadingGrid />;
  if (mockData.length === 0) return <EmptyBookingState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {mockData.map((b) => (
        <BookingCard key={b.id} booking={b} />
      ))}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <BookingCardSkeleton key={i} />
      ))}
    </div>
  );
}