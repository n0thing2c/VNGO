import BookingCard from "./BookingCard";
import EmptyBookingState from "./EmptyBookingState";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination.jsx";
import {useState} from "react";

export default function BookingList({bookings, refreshData}) {
    const [currentPage, setCurrentPage] = useState(1);
    const bookingsPerPage = 6;

    if (!bookings || bookings.length === 0) {
        return <EmptyBookingState/>;
    }
    const totalPages = Math.ceil(bookings.length / bookingsPerPage);
    const indexOfLastBooking = currentPage * bookingsPerPage;
    const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
    const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);


    return (
        <div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} refreshData={refreshData}/>
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
                                        className={currentPage === i + 1 ? "bg-gray-800 text-white" : "text-black"}
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