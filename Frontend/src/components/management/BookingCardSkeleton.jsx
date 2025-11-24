export default function BookingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl shadow-md bg-white animate-pulse">
      <div className="w-full h-52 bg-gray-300" />
      <div className="p-6 space-y-4">
        <div className="h-7 w-48 bg-gray-300 rounded" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-12 w-full bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}