import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Hotel,
    Star,
    MapPin,
    ExternalLink,
} from "lucide-react";

export default function HotelSuggestions({ hotels }) {
    if (!hotels || hotels.length === 0) {
        return (
            <div className="h-fit sticky top-4 shadow-lg rounded-xl overflow-hidden border bg-white">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <Hotel className="w-5 h-5" />
                        Hotel Suggestions
                    </h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-500 text-center py-8">
                        No hotel suggestions available for this trip.
                    </p>
                </div>
            </div>
        );
    }

    // Format currency
    const formatVND = (value) => {
        return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
    };

    return (
        <div className="h-fit sticky top-4 shadow-lg rounded-xl overflow-hidden border bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Hotel className="w-5 h-5" />
                    Recommended Hotels
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                    Stay near your tour locations
                </p>
            </div>
            
            {/* Content */}
            <div className="max-h-[600px] overflow-y-auto">
                <div className="divide-y">
                    {hotels.map((hotel, index) => (
                        <HotelCard
                            key={hotel.external_id || index}
                            hotel={hotel}
                            rank={index + 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function HotelCard({ hotel, rank }) {
    // Format currency
    const formatVND = (value) => {
        return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
    };

    // Get star icons
    const renderStars = (count) => {
        return Array(Math.floor(count || 0))
            .fill(0)
            .map((_, i) => (
                <Star
                    key={i}
                    className="w-3 h-3 fill-yellow-400 text-yellow-400"
                />
            ));
    };

    // Open booking link
    const handleBooking = () => {
        if (hotel.booking_url) {
            window.open(hotel.booking_url, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <div className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="flex-shrink-0 relative">
                    {hotel.thumbnail_url ? (
                        <img
                            src={hotel.thumbnail_url}
                            alt={hotel.name}
                            className="w-20 h-20 object-cover rounded-lg"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Hotel className="w-8 h-8 text-blue-400" />
                        </div>
                    )}
                    {rank <= 3 && (
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow">
                            {rank}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {hotel.name}
                    </h4>

                    {/* Star Rating */}
                    {hotel.star_rating > 0 && (
                        <div className="flex items-center gap-0.5 mt-1">
                            {renderStars(hotel.star_rating)}
                        </div>
                    )}

                    {/* Review Score */}
                    <div className="flex items-center gap-2 mt-1">
                        {hotel.rating > 0 && (
                            <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 text-xs"
                            >
                                <Star className="w-3 h-3 mr-0.5 fill-current" />
                                {hotel.rating.toFixed(1)}
                            </Badge>
                        )}
                        {hotel.review_count > 0 && (
                            <span className="text-xs text-gray-500">
                                {hotel.review_count} reviews
                            </span>
                        )}
                    </div>

                    {/* Distance */}
                    {hotel.distance_to_center && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {hotel.distance_to_center.toFixed(1)} km to center
                        </p>
                    )}

                    {/* Price & Book */}
                    <div className="flex items-center justify-between mt-2">
                        <div>
                            <span className="font-bold text-blue-700">
                                {formatVND(hotel.price_per_night)}
                            </span>
                            <span className="text-xs text-gray-500">/night</span>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                            onClick={handleBooking}
                        >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Book
                        </Button>
                    </div>
                </div>
            </div>

            {/* Match Score */}
            {hotel.match_score > 0 && (
                <div className="mt-2 pt-2 border-t border-dashed">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full"
                                style={{ width: `${Math.min(hotel.match_score, 100)}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-500">
                            {Math.round(hotel.match_score)}% match
                        </span>
                    </div>
                </div>
            )}

            {/* Booking Links */}
            {hotel.booking_links && (
                <div className="flex gap-2 mt-2">
                    {Object.entries(hotel.booking_links).map(([platform, url]) => (
                        <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline capitalize"
                        >
                            {platform}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

