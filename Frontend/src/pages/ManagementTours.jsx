import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, DollarSign, Plus, Edit2, Eye, Trash2 } from "lucide-react";

const UserRole = "guide";
// const UserRole = "tourist";

export default function ManagementTours() {
    // Nếu là tourist → hiển thị đặt chỗ
    if (UserRole === "tourist") {
    const bookings = [
      { id: 1, name: "Vịnh Hạ Long 2N1Đ", date: "20–22/12/2025", guests: 2, price: 5800000, status: "Đã xác nhận" },
      { id: 2, name: "Phú Quốc Sunset", date: "05/01/2026", guests: 4, price: 12000000, status: "Chờ thanh toán" },
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Đặt chỗ của tôi</h1>

          <div className="space-y-6">
            {bookings.map((b) => (
              <Card key={b.id}>
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">{b.name}</CardTitle>
                    <span className="px-4 py-2 bg-white/20 rounded-full text-sm">
                      {b.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-gray-700">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span>{b.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span>{b.guests} khách</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <span className="font-bold">{(b.price / 1000000).toFixed(1)} triệu ₫</span>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button>Xem chi tiết</Button>
                    <Button variant="outline">Hủy đặt chỗ</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Nếu là guide → hiển thị tour mình tạo
  const myTours = [
    { id: 1, title: "Khám phá Sapa 3N2Đ", status: "Đã đăng", bookings: 18, revenue: 126000000 },
    { id: 2, title: "Ninh Bình - Tràng An", status: "Bản nháp", bookings: 0, revenue: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Quản lý Tour của tôi</h1>
          <Button size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Tạo tour mới
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTours.map((tour) => (
            <Card key={tour.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{tour.title}</CardTitle>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  tour.status === "Đã đăng" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                }`}>
                  {tour.status}
                </span>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>Đặt chỗ: <strong>{tour.bookings}</strong></p>
                  <p>Doanh thu: <strong>{(tour.revenue / 1000000).toFixed(1)} triệu ₫</strong></p>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button size="sm" variant="outline"><Eye className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline"><Edit2 className="w-4 h-4" /></Button>
                  <Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}