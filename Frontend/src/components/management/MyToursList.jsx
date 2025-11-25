import TourManagementCard from "./TourManagementCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";

export default function MyToursList({ tours }) {
  if (!tours || tours.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-400 text-6xl mb-4">🗺️</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No tours yet</h3>
        <p className="text-gray-500 mb-6">
          Create your first tour to start accepting bookings.
        </p>
        <Button asChild className="bg-green-600 hover:bg-green-700 rounded-full">
          <Link to="/tour/create">
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Tour
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Tours</h2>
          <p className="text-gray-600 mt-1">
            You have {tours.length} tour{tours.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700 rounded-full">
          <Link to="/tour/create">
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New Tour
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tours.map((tour) => (
          <TourManagementCard key={tour.id} tour={tour} />
        ))}
      </div>
    </div>
  );
}

