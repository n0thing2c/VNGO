import React, { useState, useEffect, useRef } from "react";

const ANIMATION_DURATION_MS = 1800;

export default function TourStopsTimeline({ stops = [] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef(null);
  const stopRefs = useRef([]);

  // Auto-advance active stop
  useEffect(() => {
    if (!stops || stops.length === 0) return;

    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % stops.length);
    }, ANIMATION_DURATION_MS);

    return () => clearInterval(interval);
  }, [stops.length]);

  // Scroll active stop into view horizontally only
  useEffect(() => {
    if (!stops || stops.length === 0) return;

    const activeStop = stopRefs.current[activeIdx];
    const container = containerRef.current;

    if (activeStop && container) {
      const containerRect = container.getBoundingClientRect();
      const stopRect = activeStop.getBoundingClientRect();

      // Calculate horizontal center position
      const offsetLeft =
        stopRect.left - containerRect.left + container.scrollLeft;
      const offsetCenter =
        offsetLeft - container.clientWidth / 2 + stopRect.width / 2;

      container.scrollTo({
        left: offsetCenter,
        behavior: "smooth",
      });
    }
  }, [activeIdx, stops]);

  if (!stops || stops.length === 0) {
    return (
      <div className="flex items-center justify-center h-24">
        <p className="text-gray-500">No stops added yet.</p>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fill-line {
            from { width: 0%; }
            to { width: 100%; }
          }
          .animate-fill-line {
            animation: fill-line ${
              ANIMATION_DURATION_MS / 900
            }s linear forwards;
          }
          .subtle-scrollbar::-webkit-scrollbar {
            height: 6px; /* Height for horizontal scrollbar */
            width: 6px;
          }
          .subtle-scrollbar::-webkit-scrollbar-track {
            background: transparent; 
          }
          .subtle-scrollbar::-webkit-scrollbar-thumb {
            background-color: #e2e8f0; /* Light gray (Tailwind slate-200) */
            border-radius: 20px;       /* Rounded pill shape */
          }
          .subtle-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #cbd5e1; /* Darker on hover */
          }
        `}
      </style>

      <div
        className="w-full overflow-x-auto py-16 px-4 subtle-scrollbar"
        ref={containerRef}
      >
        <div className="relative flex items-center w-full">
          {stops.map((stop, idx) => {
            const isTop = idx % 2 === 0;
            const stopName =
              stop.name_en?.split(",")[0] || stop.name || "Unknown stop";
            const isActive = idx === activeIdx;

            return (
              <React.Fragment key={stop.id || idx}>
                {/* --- Stop Component --- */}
                <div
                  ref={(el) => (stopRefs.current[idx] = el)}
                  className="relative flex flex-col items-center shrink-0 px-6 first:ml-8 last:mr-8"
                >
                  {/* Label on top */}
                  {isTop && (
                    <div className="absolute bottom-full mb-2">
                      <span
                        className={`font-bold text-md text-center whitespace-nowrap transition-all duration-300 ${
                          isActive
                            ? "text-blue-600 text-lg"
                            : "text-neutral-600"
                        }`}
                      >
                        {stopName}
                      </span>
                    </div>
                  )}

                  {/* Circle */}
                  <div
                    className={`w-9 h-9 rounded-full text-white font-bold flex items-center justify-center z-10 shrink-0 border-4 border-white transition-all duration-300 ${
                      isActive
                        ? "bg-blue-500 scale-120 shadow-lg"
                        : "bg-neutral-400"
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Label on bottom */}
                  {!isTop && (
                    <div className="absolute top-full mt-2">
                      <span
                        className={`font-bold text-md text-center whitespace-nowrap transition-all duration-300 ${
                          isActive
                            ? "text-blue-600 text-lg"
                            : "text-neutral-600"
                        }`}
                      >
                        {stopName}
                      </span>
                    </div>
                  )}
                </div>

                {/* --- Line Segment --- */}
                {idx < stops.length - 1 && (
                  <div className="relative flex-1 h-1 bg-gray-300 min-w-24">
                    {isActive && (
                      <div
                        key={activeIdx}
                        className="absolute top-0 left-0 h-full bg-blue-500 animate-fill-line"
                      />
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}
