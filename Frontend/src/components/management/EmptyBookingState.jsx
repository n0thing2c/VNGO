import { PackageOpen } from "lucide-react";

export default function EmptyBookingState() {
  return (
    <div className="text-center py-20">
      <PackageOpen className="w-20 h-20 mx-auto text-gray-300 mb-6" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        Bạn chưa có đặt tour nào
      </h3>
      <p className="text-gray-500">
        Khi bạn đặt tour, chúng sẽ xuất hiện ở đây nhé!
      </p>
    </div>
  );
}