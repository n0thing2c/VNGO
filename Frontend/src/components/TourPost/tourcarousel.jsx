import {useEffect, useRef, useState} from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel.jsx";

export default function TourCarousel({images = [], forwardInterval = 3000, rewindInterval = 50}) {
    const nextBtnRef = useRef(null);
    const prevBtnRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

    if (!images || images.length === 0) return null;

    const totalSlides = images.length;

    useEffect(() => {
        const tick = () => {
            if (direction === 1) {
                nextBtnRef.current?.click();
                setCurrentIndex((prev) => {
                    if (prev + 1 >= totalSlides) {
                        setDirection(-1); // start fast rewind
                        return prev;
                    }
                    return prev + 1;
                });
            } else {
                prevBtnRef.current?.click();
                setCurrentIndex((prev) => {
                    if (prev - 1 < 0) {
                        setDirection(1); // go forward again
                        return prev;
                    }
                    return prev - 1;
                });
            }
        };

        const intervalTime = direction === 1 ? forwardInterval : rewindInterval;
        const interval = setInterval(tick, intervalTime);

        return () => clearInterval(interval);
    }, [direction, totalSlides, forwardInterval, rewindInterval]);

    return (
        <Carousel className="w-full max-w-3xl mx-auto relative">
            <CarouselContent>
                {images.map((img, idx) => (
                    <CarouselItem key={idx} className="flex justify-center items-center">
                        {/* Assuming rounded-4xl is a custom class. If not, use rounded-2xl or rounded-3xl */}
                        <div className="w-full aspect-[16/9] overflow-hidden rounded-4xl">
                            <img
                                src={img.url || img.image}
                                alt={`Slide ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>

            {/* CHANGED:
      - Mobile: Positioned inside (left-4), smaller (p-2, text-xl), semi-transparent (bg-black/60)
      - Desktop (lg): Restored original "outside" position (-left-20) and size (p-7, text-4xl)
    */}
            <CarouselPrevious
                ref={prevBtnRef}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black text-white p-2 text-xl rounded-full shadow-lg transition
                   lg:-left-20 lg:p-7 lg:text-4xl "
            />

            {/* CHANGED:
      - Mobile: Positioned inside (right-4), smaller (p-2, text-xl), semi-transparent (bg-black/60)
      - Desktop (lg): Restored original "outside" position (-right-20) and size (p-7, text-4xl)
    */}
            <CarouselNext
                ref={nextBtnRef}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white p-2 text-xl rounded-full shadow-lg transition
                   lg:-right-20 lg:p-7 lg:text-4xl "
            />
        </Carousel>
    );
}
