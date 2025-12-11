import { Star, Users, Clock, DollarSign, Calendar, CalendarDays } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PastTours({ role, pastTours }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const toursPerPage = 6;
  const totalPages = Math.ceil(pastTours.length / toursPerPage);
  const indexOfLastTour = currentPage * toursPerPage;
  const indexOfFirstTour = indexOfLastTour - toursPerPage;
  const currentTours = pastTours.slice(indexOfFirstTour, indexOfLastTour);

  const handleCardClick = (tourId) => {
    navigate(`/tour/${tourId}`);
  };

  // // Not allowed because Tour model doesn't have guideId and touristId
  // const handleProfileClick = (e, id, type) => {
  //   e.stopPropagation();
  //   if (type === "guide") {
  //     navigate(`/guide/${id}`);
  //   } else {
  //     navigate(`/tourist/${id}`);
  //   }
  // };
  if (!pastTours || pastTours.length === 0) {
    return (
      <div className="text-center py-20">
        <CalendarDays className="w-20 h-20 mx-auto text-gray-300 mb-6"/>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No past tours yet</h3>
        <p className="text-gray-500">
          {role === "tourist"
            ? "Your completed tours will appear here."
            : "Tours you've completed as a guide will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 cursor-pointer">
        {currentTours.map((tour) => (
          <div key={tour.id} onClick={() => handleCardClick(tour.tourId)} className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white">
            {/* Full width image - no gap at top */}
            {tour.image && (
              <div className="relative h-28 md:h-64 w-full overflow-hidden flex-shrink-0">
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                {/* Rating badge for tourist */}
                {role === "tourist" && tour.rating && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-gray-900">{tour.rating}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="p-2 md:p-6 flex-1 flex flex-col">
              {role === "tourist" ? (
                // Tourist view
                <>
                  <h3 className="font-bold text-sm md:text-xl text-gray-900 mb-1 md:mb-2 line-clamp-2">{tour.title}</h3>
                  <p className="text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">
                    Guide: <span className="font-medium">{tour.guideName}</span>
                  </p>
                  {/* <p className="text-sm text-gray-600 mb-4"><Calendar className="w-4 h-4 flex-shrink-0" /> {tour.date}</p> */}

                  {/* <Button asChild className="mt-auto w-full bg-green-600 hover:bg-green-700 rounded-full h-11">
                    <Link to={`/tour/${tour.tourId}`}>View tour</Link>
                  </Button> */}
                </>
              ) : (
                // Guide view
                <>
                  <h3 className="font-bold text-sm md:text-xl text-gray-900 mb-1 md:mb-2 line-clamp-2">{tour.title}</h3>
                  <p className="text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">
                    Tourist: <span className="font-medium">{tour.touristName}</span>
                  </p>
                  {/* <p className="text-sm text-gray-600 mb-4"><Calendar className="w-4 h-4 flex-shrink-0" /> {tour.date}</p> */}
                </>
              )}
              <div className="mb-2 md:mb-4 grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-3 text-xs md:text-sm">
                {tour.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    <span className="truncate">
                      {new Date(tour.date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {tour.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    <span>{tour.duration}h</span>
                  </div>
                )}
                {/*Model Tour does not have tourTime*/}
                {/* {tour.tourTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {tour.tourTime.slice(0, 5)}
                      {tour.duration ? (
                        (() => {
                          const [hours, minutes] = booking.tourTime.split(':').map(Number);
                          const date = new Date();
                          date.setHours(hours, minutes);
                          date.setHours(date.getHours() + booking.duration);
                          return ` - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                        })()
                      ) : ""}
                    </span>
                  </div>
                )} */}
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span>{tour.number_of_guests} guest{tour.number_of_guests > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 text-green-600" />
                  <span className="font-semibold text-green-600">{tour.revenue}</span>
                </div>
              </div>

              {/* <Button asChild className="mt-auto w-full bg-green-600 hover:bg-green-700 rounded-full h-11">
                <Link to={`/tour/${tour.tourId}`}>View tour</Link>
              </Button> */}
            </div>
          </div>
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
                  onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}
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
                  onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}