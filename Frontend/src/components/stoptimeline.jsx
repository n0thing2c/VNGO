export default function TourStopsTimeline({ stops = [] }) {
  if (!stops || stops.length === 0) return <p>No stops added yet.</p>;

  return (
    <div className="flex flex-col">
      {stops.map((stop, idx) => (
        <div key={stop.id || idx} className="flex gap-4">

          {/* --- Timeline Column --- */}
          <div className="flex flex-col items-center">
            {/* Circle with number */}
            <div className="w-8 h-8 rounded-full bg-neutral-300 text-white font-bold flex items-center justify-center z-10 shrink-0">
              {idx + 1}
            </div>

            {/* Line connecting to next circle */}
            {idx < stops.length - 1 && (
              // CHANGED: flex-1 makes the line fill the remaining space
              <div className="w-0.5 flex-1 bg-gray-300" />
            )}
          </div>

          {/* --- Stop Info Column --- */}
          {/* CHANGED: Added pb-8 to create space for the line to draw into */}
          <div className="flex flex-col pb-8">
            <span className="font-bold text-lg text-neutral-600 pt-1">
              {stop.name_en.split(',')[0]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}