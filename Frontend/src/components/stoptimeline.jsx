export default function TourStopsTimeline({ stops = [] }) {
  if (!stops || stops.length === 0) return <p>No stops added yet.</p>;

  return (
    <div className="flex flex-col items-start relative">
      {stops.map((stop, idx) => (
        <div key={stop.id || idx} className="flex items-start p-3 gap-4 relative">
          {/* Circle with number */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-400 text-white font-bold flex items-center justify-center z-10">
              {idx + 1}
            </div>
            {/* Line connecting to next circle */}
            {idx < stops.length - 1 && (
              <div className="w-1 h-full bg-gray-300 -mt-1" />
            )}
          </div>

          {/* Stop Info */}
          <div className="flex flex-col gap-4">
            <span className="font-bold text-lg">{stop.name_en.split(',')[0]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
