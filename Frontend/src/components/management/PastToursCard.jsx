import { Star, Users, Clock, DollarSign, Calendar, CalendarDays } from "lucide-react";

export default function PastTours({ role, pastTours }) {
  const handleCardClick = (tourId) => {
    // Navigate to view page
    window.location.href = `/tour/${tourId}`;
  };
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pastTours.map((tour) => (
          <div key={tour.id} onClick={() => handleCardClick(tour.tourId)} className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white">
            {/* Full width image - no gap at top */}
            {tour.image && (
              <div className="relative h-64 w-full overflow-hidden flex-shrink-0">
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                {/* Rating badge for tourist */}
                {role === "tourist" && tour.rating && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-gray-900">{tour.rating}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="p-6 flex-1 flex flex-col">
              {role === "tourist" ? (
                // Tourist view
                <>
                  <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2">{tour.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Guide: <span className="font-medium">{tour.guideName}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4"><Calendar className="w-4 h-4 flex-shrink-0" /> {tour.date}</p>
                  
                  {/* <Button asChild className="mt-auto w-full bg-green-600 hover:bg-green-700 rounded-full h-11">
                    <Link to={`/tour/${tour.tourId}`}>View tour</Link>
                  </Button> */}
                </>
              ) : (
                // Guide view
                <>
                  <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2">{tour.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Tourist: <span className="font-medium">{tour.touristName}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4"><Calendar className="w-4 h-4 flex-shrink-0" /> {tour.date}</p>
                  
                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>{tour.number_of_guests} guest{tour.number_of_guests > 1 ? 's' : ''}</span>
                    </div>
                    {tour.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{tour.duration}h</span>
                      </div>
                    )}
                    <div className="col-span-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 flex-shrink-0 text-green-600" />
                      <span className="font-semibold text-green-600">{tour.revenue}</span>
                    </div>
                  </div>
                  
                  {/* <Button asChild className="mt-auto w-full bg-green-600 hover:bg-green-700 rounded-full h-11">
                    <Link to={`/tour/${tour.tourId}`}>View tour</Link>
                  </Button> */}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}