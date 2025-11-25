import BookingCard from "./BookingCard";
import EmptyBookingState from "./EmptyBookingState";

export default function BookingList({ bookings, refreshData }) {
  if (!bookings || bookings.length === 0) {
    return <EmptyBookingState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} refreshData={refreshData} />
      ))}
    </div>
  );
}