import BookingCard from "./BookingCard";

const mockIncoming = [
  { id: 7, title: "Đà Nẵng - Hội An 2N1Đ", guideName: "Khang", status: "Pending", image: "https://images.unsplash.com/photo-1555400035847-742d343f2cb9?w=800" },
  { id: 8, title: "Hà Giang Loop 4N3Đ", guideName: "Khang", status: "Pending", image: "https://images.unsplash.com/photo-1506905925346-5006b989a7e2?w=800" },
];

export default function IncomingRequests() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockIncoming.map((b) => (
          <BookingCard key={b.id} booking={b} showActions />
        ))}
      </div>
    </div>
  );
}