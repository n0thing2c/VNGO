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
export default function IncomingRequests({ incomingRequests, refreshData }) {
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 6;

  if (!incomingRequests || incomingRequests.length === 0) {
    return (
      <EmptyBookingState
        message="No incoming booking requests"
        description="You will see new booking requests from tourists here."
      />
    );
  }

  const totalPages = Math.ceil((incomingRequests?.length || 0) / requestsPerPage);

  // Sort requests by date nearest to today (ascending)
  const sortedRequests = [...(incomingRequests || [])].sort((a, b) => {
    const dateA = new Date(`${a.tourDate}T${a.tourTime}`);
    const dateB = new Date(`${b.tourDate}T${b.tourTime}`);
    return dateA - dateB;
  });

  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = sortedRequests.slice(indexOfFirstRequest, indexOfLastRequest);

  if (!incomingRequests || incomingRequests.length === 0) {
    return (
      <EmptyBookingState
        message="No incoming booking requests"
        description="You will see new booking requests from tourists here."
      />
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {currentRequests.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            showActions
            refreshData={refreshData}
          />
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

              {Array.from({ length: totalPages }).map((_, i) => (
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
                  <PaginationEllipsis />
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