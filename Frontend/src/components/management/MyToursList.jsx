import TourManagementCard from "./MyToursCard";
import {Button} from "@/components/ui/button";
import {Link} from "react-router-dom";
import {PlusCircle} from "lucide-react";
import {tourService} from "@/services/tourService";
import {Map} from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import {useState, useEffect} from "react";

export default function MyToursList({tours, refreshTours}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [toursPerPage] = useState(6);
    const [localTours, setLocalTours] = useState(tours);
    // Keep localTours in sync if tours prop changes
    useEffect(() => {
        setLocalTours(tours);
    }, [tours]);

    const indexOfLastTour = currentPage * toursPerPage;
    const indexOfFirstTour = indexOfLastTour - toursPerPage;
    const currentTours = localTours.slice(indexOfFirstTour, indexOfLastTour);

    const totalPages = Math.ceil(tours.length / toursPerPage);

    const handleDelete = async (tourId) => {
        try {
            const res = await tourService.deleteTour(tourId);

            // Auto-refresh after deletion
            if (res.success) {
                // Optimistically remove tour from UI immediately
                setLocalTours((prev) => prev.filter((t) => t.id !== tourId));

                // Optional: sync with server
                refreshTours?.();
            }

        } catch (error) {
            console.error("Failed to delete tour:", error);
        }
    };

    if (!tours || tours.length === 0) {
        return (
            <div className="text-center py-20 ">
                <Map className="w-20 h-20 mx-auto text-gray-300 mb-6"/>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No tours yet</h3>
                <p className="text-gray-500 mb-6">
                    Create your first tour to start accepting bookings.
                </p>
                <Button asChild
                    className="bg-[#068F64] hover:bg-white border hover:border-black hover:text-black text-white rounded-full">
                    <Link to="/tour/create">
                        <PlusCircle className="w-5 h-5"/>
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
                        You have {localTours.length} tour{localTours.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <Button asChild
                    className="bg-[#068F64] border hover:bg-white hover:border-black hover:text-black rounded-full">
                    <Link to="/tour/create">
                        <PlusCircle className="w-5 h-5 mr-2"/>
                        Create New Tour
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {currentTours.map((tour) => (
                    <TourManagementCard key={tour.id} tour={tour} onDelete={handleDelete}/>
                ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                                    }}
                                />
                            </PaginationItem>

                            {Array.from({length: totalPages}).map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage(i + 1);
                                        }}
                                        className={
                                            currentPage === i + 1
                                                ? "bg-gray-800 text-white"
                                                : "text-black"
                                        }
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            {totalPages > 5 && (
                                <PaginationItem>
                                    <PaginationEllipsis/>
                                </PaginationItem>
                            )}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
