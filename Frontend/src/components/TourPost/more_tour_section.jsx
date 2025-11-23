import {useEffect, useState} from "react";
import TourCard from "@/components/TourCard.jsx";
import {tourService} from "@/services/tourService.js";
import {toast} from "sonner";
import {FieldLabel} from "@/components/ui/field.jsx";
import {LucidePersonStanding} from "lucide-react";

export default function MoreTourByGuide({ guide, currentTourId }) {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!guide?.id) return;

        const fetchTours = async () => {
            setLoading(true);
            const res = await tourService.getAllToursByGuide(guide.id);
            if (res.success) {
                // Exclude the current tour
                const filteredTours = (res.data || []).filter(tour => tour.id !== currentTourId);
                setTours(filteredTours);
            } else {
                toast.error("Failed to load tours for this guide.");
            }
            setLoading(false);
        };

        fetchTours();
    }, [guide, currentTourId]);

    if (!guide) return null;

    const displayedTours = expanded ? tours : tours.slice(0, 3);

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center text-center -mt-8">
            <LucidePersonStanding className="w-10 h-10 mb-2 text-gray-600"/>
            <FieldLabel className="text-4xl font-semibold mb-10 text-gray-600">
                More Tours by {guide.name}
            </FieldLabel>

            {loading && <p className="text-gray-500">Loading tours...</p>}
            {!loading && tours.length === 0 && (
                <p className="text-gray-500">No other tours available from this guide.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {displayedTours.map((tour) => (
                    <TourCard key={tour.id} tour={tour}/>
                ))}
            </div>

            {!expanded && tours.length > 3 && (
                <div className="mt-8 flex justify-center">
                    <button
                        className="px-4 py-1 bg-[#139d7a] text-white rounded-2xl hover:bg-[#0f7a60] transition"
                        onClick={() => setExpanded(true)}
                    >
                        See More
                    </button>
                </div>
            )}
        </div>
    );
}


