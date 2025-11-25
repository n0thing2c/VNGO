import { PackageOpen } from "lucide-react";

export default function EmptyBookingState({ 
  message = "No booking yet",
  description = "Your upcoming trips will show up here once you book."
}) {
  return (
    <div className="text-center py-20">
      <PackageOpen className="w-20 h-20 mx-auto text-gray-300 mb-6" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        {message}
      </h3>
      <p className="text-gray-500">
        {description}
      </p>
    </div>
  );
}