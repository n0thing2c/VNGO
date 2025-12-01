import React, { useState, useEffect, useRef } from "react";

export default function TourStopsTimeline({ stops = [] }) {
    const [scrollProgress, setScrollProgress] = useState(0);
    const containerRef = useRef(null);
    const stopRefs = useRef([]);
    const segmentRefs = useRef([]);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollStart = useRef(0);

    // const mockDescriptions = stops.map(
    //     (s, i) => s.description || `This is a mock description for stop #${i + 1}. This is a mock description for stop #${i + 1}. This is a mock description for stop #${i + 1}. This is a mock description for stop #${i + 1}. This is a mock description for stop #${i + 1}. This is a mock description for stop #${i + 1}. This is a mock description for stop #${i + 1}.`
    // );

    // --- LOGIC LẤY DESCRIPTION ---
    // Dựa vào scrollProgress để tính index hiện tại
    const currentIndex = Math.min(
        Math.floor(scrollProgress * (stops.length - 1) + 0.1), // +0.1 để fix lỗi làm tròn
        stops.length - 1
    );

    // Lấy description thật, nếu không có thì hiện fallback text
    const currentDescription = stops[currentIndex]?.description || "No description available for this stop.";

    const totalSegments = stops.length - 1;

    useEffect(() => {
        const container = containerRef.current;
        if (!container || stops.length === 0) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const maxScroll = container.scrollWidth - container.clientWidth;
            const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
            setScrollProgress(progress);

            // Update line segments immediately for smooth flow
            segmentRefs.current.forEach((seg, idx) => {
                if (!seg) return;
                const startProgress = idx / totalSegments;
                const endProgress = (idx + 1) / totalSegments;
                let fill = 0;
                if (progress >= endProgress) fill = 100;
                else if (progress > startProgress)
                    fill = ((progress - startProgress) / (1 / totalSegments)) * 100;
                seg.style.width = `${fill}%`;
            });
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [stops, totalSegments]);

    // Drag handlers
    const onMouseDown = (e) => {
        isDragging.current = false;
        startX.current = e.clientX;
        scrollStart.current = containerRef.current.scrollLeft;
        containerRef.current.style.cursor = "grabbing";
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
        const dx = e.clientX - startX.current;
        if (Math.abs(dx) > 3) isDragging.current = true;
        containerRef.current.scrollLeft = scrollStart.current - dx;
    };

    const onMouseUp = () => {
        containerRef.current.style.cursor = "grab";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    };

    if (!stops.length) {
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
          .subtle-scrollbar::-webkit-scrollbar { display: none; }
          .subtle-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
            </style>

            <div
                className="w-full overflow-x-auto py-16 px-4 subtle-scrollbar cursor-grab"
                ref={containerRef}
                onMouseDown={onMouseDown}
                onClick={(e) => {
                    if (isDragging.current) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
            >
                <div className="relative flex items-center w-max">
                    {stops.map((stop, idx) => {
                        const isTop = idx % 2 === 0;
                        const stopName = stop.name_en?.split(",")[0] || stop.name || "Unknown stop";

                        const circleOffset = 0.003;
                        const isActive = idx === 0 || scrollProgress >= idx / totalSegments - circleOffset;

                        const handleClickStop = () => {
                            // Only scroll if not dragging
                            if (!isDragging.current && stopRefs.current[idx]) {
                                stopRefs.current[idx].scrollIntoView({
                                    behavior: "smooth",
                                    block: "nearest",   // prevents vertical scrolling
                                    inline: "center",   // scrolls horizontally to center
                                });

                            }
                        };

                        return (
                            <React.Fragment key={stop.id || idx}>
                                <div
                                    ref={(el) => (stopRefs.current[idx] = el)}
                                    className={`flex flex-col items-center shrink-0 relative first:ml-40 md:first:ml-55 lg:first:ml-70 last:pr-40 md:last:pr-55 lg:last:pr-70 cursor-pointer`}
                                    onClick={handleClickStop}
                                >
                                    {isTop && (
                                        <div className="absolute bottom-full mb-2 max-w-[300px] truncate">
                                            <span
                                                className={`font-bold whitespace-nowrap transition-all duration-300 ${isActive ? "text-[#00c295] text-lg" : "text-neutral-600"
                                                    }`}
                                            >
                                                {stopName}
                                            </span>
                                        </div>
                                    )}

                                    <div
                                        className={`w-9 h-9 z-10 rounded-full flex items-center justify-center border-4 border-white font-bold text-white transition-all duration-300 ${isActive ? "bg-[#00c295] scale-125 shadow-lg" : "bg-neutral-400"
                                            }`}
                                    >
                                        {idx + 1}
                                    </div>

                                    {!isTop && (
                                        <div className="absolute top-full mt-2 max-w-[300px] truncate">
                                            <span
                                                className={`font-bold whitespace-nowrap transition-all duration-300 ${isActive ? "text-[#00c295] text-lg" : "text-neutral-600"
                                                    }`}
                                            >
                                                {stopName}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Line segment */}
                                {idx < stops.length - 1 && (
                                    <div
                                        className="relative flex-1 h-1 bg-gray-300 min-w-24 sm:min-w-32 md:min-w-40 lg:min-w-48">
                                        <div
                                            ref={(el) => (segmentRefs.current[idx] = el)}
                                            className="absolute top-0 left-0 h-full bg-[#00c295] transition-[width] duration-75"
                                            style={{ width: "0%" }}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}

                </div>
            </div>

            <div className="mt-8 px-4">
                <p className="text-neutral-700 text-md max-w-3xl mx-auto leading-relaxed text-start whitespace-pre-wrap">
                    {/* {mockDescriptions[Math.floor(scrollProgress * totalSegments)]} */}
                    {currentDescription}
                </p>
            </div>
        </>
    );
}
