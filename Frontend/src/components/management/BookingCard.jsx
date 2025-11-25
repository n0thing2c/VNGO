// src/components/management/BookingCard.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function BookingCard({ booking }) {
  const isAccepted = booking.status.toLowerCase() === "Accepted";

  return (
    <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow">
      <div className="relative">
        <img
          src={booking.image || "/placeholder.jpg"}
          alt={booking.title}
          className="w-full h-52 object-cover"
        />
        <Badge
          className={`absolute top-4 left-4 font-medium px-3 py-1 ${
            isAccepted
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {booking.status}
        </Badge>
      </div>

      <div className="p-6">
        <h3 className="font-bold text-xl text-gray-900">{booking.title}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Tour guide: <span className="font-semibold">{booking.guideName}</span>
        </p>

        <Button asChild className="mt-5 w-full bg-green-600 hover:bg-green-700 rounded-full h-12">
          <Link to={`/tour/${booking.id}`}>View details</Link>
        </Button>
      </div>
    </Card>
  );
}