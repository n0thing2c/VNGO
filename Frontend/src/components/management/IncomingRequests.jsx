import BookingCard from "./BookingCard";
import EmptyBookingState from "./EmptyBookingState";

export default function IncomingRequests({ incomingRequests, refreshData }) {
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
        {incomingRequests.map((booking) => (
          <BookingCard 
            key={booking.id} 
            booking={booking} 
            showActions 
            refreshData={refreshData} 
          />
        ))}
      </div>
    </div>
  );
}