import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Clock, Users, Star, DollarSign, BookOpen, CheckCircle, AlertCircle} from "lucide-react";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function TourManagementCard({tour, onDelete}) {
    const handleCardClick = () => {
        // Navigate to view page
        window.location.href = `/tour/${tour.id}`;
    };

    const handleEditClick = (e) => {
        e.stopPropagation(); // Prevent triggering card click
        window.location.href = `/tour/edit/${tour.id}`;
    };

    return (
        <div
            className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white"
            onClick={handleCardClick}>
            {/* Full width image - no gap at top */}
            <div className="relative h-64 w-full overflow-hidden flex-shrink-0">
                <img
                    src={tour.image || "/placeholder.jpg"}
                    alt={tour.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />

                {/* Booking stats badge */}
                {tour.bookings && tour.bookings.total > 0 && (
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {tour.bookings.pending > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800 font-medium px-3 py-1 shadow-lg">
                                <AlertCircle className="w-3 h-3 mr-1"/>
                                {tour.bookings.pending} pending
                            </Badge>
                        )}
                        {tour.bookings.accepted > 0 && (
                            <Badge className="bg-green-100 text-green-800 font-medium px-3 py-1 shadow-lg">
                                <CheckCircle className="w-3 h-3 mr-1"/>
                                {tour.bookings.accepted} accepted
                            </Badge>
                        )}
                    </div>
                )}

                {/* Rating badge */}
                {tour.rating > 0 && (
                    <div
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/>
                            <span className="font-semibold text-gray-900">{tour.rating}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2">{tour.title}</h3>

                {/* Location */}
                {tour.location && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1"> {tour.location}</p>
                )}

                {/* Tour stats in 2 columns */}
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0"/>
                        <span>{tour.duration}h</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0"/>
                        <span>{tour.groupSize}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 flex-shrink-0 text-green-600"/>
                        <span className="font-semibold text-green-600">
              {tour.price.toLocaleString()} ₫
            </span>
                    </div>

                    {tour.bookings && (
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 flex-shrink-0"/>
                            <span>{tour.bookings.total} booking{tour.bookings.total !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                {tour.tags && tour.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {tour.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                        {tour.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{tour.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Actions - push to bottom */}
                {/* Actions - push to bottom */}
                <div className="flex gap-2 mt-auto">
                    <Button
                        onClick={handleEditClick}
                        className="flex-1 justify-center gap-2 bg-[#4673E6] rounded-full border border-transparent hover:bg-white hover:border-black hover:text-black text-white h-10"
                    >
                        Edit
                    </Button>

                    {/* DELETE with ALERT DIALOG */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                onClick={(e) => e.stopPropagation()}
                                variant="outline"
                                className="flex-1 rounded-full h-10 border bg-[#CC3737] hover:bg-white hover:border-black hover:text-black text-white"
                            >
                                Delete
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Tour</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your tour
                                    <span className="font-semibold"> "{tour.title}"</span>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => onDelete?.(tour.id)}
                                    className="bg-[#CC3737] hover:bg-red-700 text-white"
                                >
                                    Delete Tour
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                </div>
            </div>
        </div>
    );
}