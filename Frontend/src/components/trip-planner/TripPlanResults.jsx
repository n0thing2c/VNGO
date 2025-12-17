import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    Clock,
    MapPin,
    Star,
    DollarSign,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Bus,
    Footprints,
    Car,
    Sparkles,
} from "lucide-react";

// Transport icon mapping
const transportIcons = {
    public: Bus,
    private: Car,
    walk: Footprints,
};

export default function TripPlanResults({ tripPlan }) {
    const navigate = useNavigate();
    const [expandedDays, setExpandedDays] = useState(
        tripPlan.days.map((_, i) => i === 0) // First day expanded by default
    );

    // Toggle day expansion
    const toggleDay = (index) => {
        setExpandedDays((prev) => {
            const newState = [...prev];
            newState[index] = !newState[index];
            return newState;
        });
    };

    // Format currency
    const formatVND = (value) => {
        return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
    };

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg">
                <CardContent className="py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-emerald-100 text-sm">Destination</p>
                            <p className="text-xl font-bold">{tripPlan.province}</p>
                        </div>
                        <div>
                            <p className="text-emerald-100 text-sm">Total Tours</p>
                            <p className="text-xl font-bold">{tripPlan.tours_included}</p>
                        </div>
                        <div>
                            <p className="text-emerald-100 text-sm">Est. Cost</p>
                            <p className="text-xl font-bold">
                                {formatVND(tripPlan.total_cost)}
                            </p>
                        </div>
                        <div>
                            <p className="text-emerald-100 text-sm">Budget Left</p>
                            <p className="text-xl font-bold">
                                {formatVND(tripPlan.budget_remaining)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-emerald-200" />

                {/* Day Cards */}
                {tripPlan.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="relative pl-14 pb-6">
                        {/* Day Circle */}
                        <div className="absolute left-0 w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {day.day_number}
                        </div>

                        {/* Day Content */}
                        <Card className="shadow-md hover:shadow-lg transition-shadow">
                            <CardHeader
                                className="cursor-pointer py-4"
                                onClick={() => toggleDay(dayIndex)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-lg">
                                            Day {day.day_number}
                                        </CardTitle>
                                        {day.date && (
                                            <Badge variant="outline">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {day.date}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-500">
                                            {day.tours.length} tours • {day.total_duration}h
                                        </span>
                                        {expandedDays[dayIndex] ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {expandedDays[dayIndex] && (
                                <CardContent className="pt-0">
                                    <div className="space-y-4">
                                        {day.tours.map((tour, tourIndex) => (
                                            <TourCard
                                                key={tour.id}
                                                tour={tour}
                                                isFirst={tourIndex === 0}
                                                onViewTour={() =>
                                                    navigate(`/tour/${tour.id}`)
                                                }
                                            />
                                        ))}

                                        {day.tours.length === 0 && (
                                            <p className="text-center text-gray-500 py-8">
                                                No tours scheduled for this day.
                                                Free day to explore!
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TourCard({ tour, isFirst, onViewTour }) {
    const TransportIcon = transportIcons[tour.transportation] || Bus;

    // Format currency
    const formatVND = (value) => {
        return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
    };

    return (
        <div
            className={`group rounded-lg border p-4 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all ${
                isFirst ? "" : "mt-3"
            }`}
        >
            <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                    {tour.thumbnail ? (
                        <img
                            src={tour.thumbnail}
                            alt={tour.name}
                            className="w-24 h-24 md:w-32 md:h-24 object-cover rounded-lg"
                        />
                    ) : (
                        <div className="w-24 h-24 md:w-32 md:h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Tour Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h4 className="font-semibold text-gray-900 truncate">
                                {tour.name}
                            </h4>
                            {tour.guide_name && (
                                <p className="text-sm text-gray-500">
                                    with {tour.guide_name}
                                </p>
                            )}
                        </div>
                        {tour.recommendation_score > 0 && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex-shrink-0">
                                <Sparkles className="w-3 h-3 mr-1" />
                                {Math.round(tour.recommendation_score)}
                            </Badge>
                        )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                        {tour.suggested_start_time && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {tour.suggested_start_time}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {tour.duration}h
                        </span>
                        <span className="flex items-center gap-1">
                            <TransportIcon className="w-3.5 h-3.5" />
                            {tour.transportation}
                        </span>
                        {tour.rating > 0 && (
                            <span className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                {tour.rating.toFixed(1)}
                            </span>
                        )}
                    </div>

                    {/* Tags */}
                    {tour.tags && tour.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {tour.tags.slice(0, 3).map((tag, i) => (
                                <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Price & Action */}
                    <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-emerald-700">
                            {formatVND(tour.price)}
                            <span className="text-xs text-gray-500 font-normal">
                                /person
                            </span>
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={onViewTour}
                        >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            View
                        </Button>
                    </div>
                </div>
            </div>

            {/* Recommendation Reason */}
            {tour.recommendation_reasons && tour.recommendation_reasons.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed">
                    <p className="text-xs text-gray-500">
                        <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
                        {tour.recommendation_reasons.join(" • ")}
                    </p>
                </div>
            )}
        </div>
    );
}

