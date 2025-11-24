import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mockTouristPast = [
  { id: 101, title: "Phú Quốc 2024", date: "15–18/10/2024", rating: 5 },
  { id: 102, title: "Sapa Fansipan", date: "01–04/11/2024", rating: 4.8 },
];

const mockGuidePast = [
  { id: 201, title: "Phú Quốc 2024", guests: 12, revenue: "89.4 triệu ₫" },
  { id: 202, title: "Hạ Long Bay", guests: 8, revenue: "56.2 triệu ₫" },
];

export default function PastTours({ role }) {
  const data = role === "tourist" ? mockTouristPast : mockGuidePast;

  return (
    <div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.map((tour) => (
          <Card key={tour.id} className="p-6">
            {"date" in tour ? (
              // Tourist view
              <>
                <h3 className="font-semibold text-lg">{tour.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{tour.date}</p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="font-medium">{tour.rating}</span>
                </div>
                <Button className="mt-4 w-full rounded-full" variant="outline">
                  Viết đánh giá
                </Button>
              </>
            ) : (
              // Guide view
              <>
                <h3 className="font-semibold text-lg">{tour.title}</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <p>Số khách: <strong>{tour.guests}</strong></p>
                  <p>Doanh thu: <strong className="text-green-600">{tour.revenue}</strong></p>
                </div>
                <Button className="mt-4 w-full rounded-full" variant="outline">
                  Xem chi tiết
                </Button>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}