import {TourRoute} from "@/components/APIs/Map.jsx";
import React, {use, useState} from "react";
import {useEffect} from "react";
import {
    Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldTitle,
} from "@/components/ui/field"
import {Input} from "@/components/ui/input"
import {
    IdCard,
    MotorbikeIcon,
    Clock,
    UserPlus,
    Tag,
    Coins,
    PictureInPicture2Icon,
    Pin,
    CarFront,
    BusFront,
    Footprints,
    CircleDollarSignIcon,
    Edit2,
    RefreshCw,
    Trophy,
    Award, UserStar, Star, Clover,
    Plus, MessageSquarePlus, Flame, ArrowRightLeft
} from "lucide-react"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import TagSelector from "@/components/tagsselector.jsx";
import VNDInput from "@/components/priceinput.jsx";
import {Textarea} from "@/components/ui/textarea.jsx";
import ImageUploader from "@/components/imageuploader.jsx";
import DragList from "@/components/drag_list.jsx";
import {toast} from "sonner";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button.jsx";
import {Rating, RatingButton} from "@/components/ui/shadcn-io/rating/index.jsx";
import TourCarousel from "@/components/TourPost/tourcarousel.jsx";
import {Calendar22} from "@/components/ui/datepicker.jsx";
import TourStopsTimeline from "@/components/TourPost/stoptimeline.jsx";
import {useParams} from "react-router-dom";
import Header from "@/components/layout/Header.jsx";
import Footer from "@/components/layout/Footer.jsx";
import {Badge} from "@/components/ui/badge.jsx";
import {AchievementBadge} from "@/components/TourPost/tour_achievements.jsx";
import TourRate from "@/components/TourPost/tour_rate.jsx";
import {cn} from "@/lib/utils";
import TourRating from "@/components/TourPost/tour_rating.jsx";

export default function TourPost() {
    const {tour_id} = useParams();
    const [tourData, setTourData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState("VND");
    const [groupsize, setgroupsize] = useState(null);
    const [date, setdate] = useState(null);
    const [time, settime] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [hasRated, setHasRated] = useState(false);
    const [achievements, setAchievements] = useState([]);
    const TOUR_TAG_VARIANTS = {
        "Nature": "brightgreen",
        "Beach": "sand",
        "Trekking": "aqua",
        "Culture": "bluelavender",
        "History": "mustard",
        "Local Experience": "mint",
        "Sightseeing": "teal",
        "Adventure": "destructive",
        "Food & Drink": "coral",
        "Nightlife": "violet",
        "City Life": "orange",
        "Shopping": "pink",
        "Photography": "default",
        "Relaxation": "lime",
        "Water Sports": "sky",
        "Countryside": "olive",
        "Recreational": "peach",
    };
    const ACHIEVEMENT_VARIANTS = {
        "Popular": "popular",
        "Highly Rated": "highlyrated",
        "Multilingual": "multilingual",
        "Budget": "budget",
        "Luxury": "luxury",
        "Most Reviewed": "reviews",
        // Add more if needed
    };
    // Fetch from backend (unchanged)
    useEffect(() => {
        async function fetchTour() {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/tour/get/${tour_id}/`);
                const data = await res.json();
                setTourData(data);
            } catch (err) {
                console.error("Failed to load tour:", err);
            } finally {
                setLoading(false);
            }
        }

        if (tour_id) fetchTour();
    }, [tour_id]);

    useEffect(() => {
        async function fetchAchievements() {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/tour/achievements/${tour_id}/`);
                const data = await res.json();
                setAchievements([
                    "Popular",
                    "Highly Rated",
                    "Multilingual",
                    //"Budget",
                    //"Luxury",
                    "Most Reviewed",
                ]);
            } catch (err) {
                console.error("Failed to fetch achievements:", err);
            }
        }

        if (tour_id) fetchAchievements();
    }, [tour_id]);

    useEffect(() => {
        async function fetchRatings() {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/tour/ratings/${tour_id}/`);
                const data = await res.json();
                if (data.success) {
                    setRatings(data.ratings);
                }
            } catch (err) {
                console.error("Failed to fetch ratings:", err);
            }
        }

        if (tour_id) fetchRatings();
    }, [tour_id]);

    if (loading) return <p className="text-center p-4">Loading tour...</p>;
    if (!tourData) return <p className="text-center p-4">Tour not found.</p>;

    const {tour} = tourData;
    const averageRating = tour.rating_count > 0 ? (tour.rating_total / tour.rating_count).toFixed(1) : 0;

    return (
        <div className="items-center">
            {/* CHANGED: Switched to CSS Grid for layout control */}
            <div
                className="grid grid-cols-1 md:grid-cols-5 gap-y-6 md:gap-x-8 lg:gap-x-25 max-w-7xl mx-auto py-6 px-4 mt-40 mb-40">

                {/* Main Content Area */}
                {/* CHANGED: On desktop, spans 3 of 5 columns */}
                <div className="flex w-full flex-col gap-6 md:col-span-3">

                    {/*row 1*/}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4 sm:gap-2">
                            {/* Tour Name */}
                            <FieldLabel className="text-4xl sm:text-5xl lg:text-6xl font-bold break-words text-[#020765]">
                                {tour.name}
                            </FieldLabel>

                            {/* Achievements */}
                            <div className="flex flex-wrap gap-2 items-center -mb-4">
                                {achievements.map((ach) => (
                                    <AchievementBadge
                                        key={ach}
                                        variant={ACHIEVEMENT_VARIANTS[ach]}
                                        label={ach}
                                    />
                                ))}
                            </div>
                        </div>
                        {tour.tags.map((tag, index) =>
                            (
                                <span key={index} className="mr-2">
                                    <Badge
                                        variant={TOUR_TAG_VARIANTS[tag] || "default"}
                                        className="cursor-pointer"
                                    >
                                      {tag}
                                    </Badge>
                                </span>
                            ))}
                    </div>


                    {/*row 2*/}
                    <div className="flex items-center gap-2 sm:gap-3 mb-5">
                        {/* Star / Custom Icon Rating */}
                        <div className="flex gap-1">
                            {Array.from({length: 5}).map((_, index) => (
                                // If tour is highly rated, show emerald UserStar, otherwise yellow stars
                                achievements.includes("Highly Rated") ? (
                                    <Star
                                        key={index}
                                        size={25}
                                        fill={index < Math.round(averageRating) ? "#FFD700" : "#DDD"} // gold filled vs empty
                                        stroke={index < Math.round(averageRating) ? "#FFD700" : "#DDD"} // outline color
                                        style={{
                                            filter:
                                                index < Math.round(averageRating)
                                                    ? "drop-shadow(0 0 4px rgba(255,215,0,0.5)) drop-shadow(0 0 6px rgba(255,215,0,0.3))"
                                                    : "none",
                                        }}
                                    />

                                ) : (
                                    <Star
                                        key={index}
                                        size={25}
                                        fill={index < Math.round(averageRating) ? "#FFD700" : "#DDD"} // gold filled vs gray empty
                                        stroke={index < Math.round(averageRating) ? "#FFD700" : "#DDD"} // optional: gold outline
                                    />
                                )
                            ))}
                        </div>

                        {/* Number of votes */}
                        <span className="text-gray-600 text-base sm:text-lg">
                            {averageRating} ({tour.rating_count} votes)
                          </span>
                    </div>

                    {/*row 3*/}
                    <div className="flex justify-start">
                        <TourCarousel images={tour.tour_images}/>
                    </div>

                    {/*row 4*/}
                    <div className="mt-4">
                        <Card className="w-full bg-neutral-200 rounded-4xl h-24"/>
                    </div>

                    {/*row 5*/}
                    <div className="flex flex-col gap-4 mt-4">
                        <FieldLabel className="text-xl sm:text-2xl lg:text-3xl text-[#020765]">
                            Tour Schedule
                        </FieldLabel>
                        <TourStopsTimeline stops={tour.tour_places?.map(tp => tp.place) || []}/>

                        <Dialog>
                            <DialogTitle/>
                            <DialogTrigger asChild>
                                <Button variant="outline"
                                        className="w-full sm:w-auto rounded-2xl text-white bg-black text-xl">View Tour
                                    Route</Button>
                            </DialogTrigger>
                            <DialogContent className="w-full sm:max-w-4xl">
                                <DialogDescription/>
                                <TourRoute Stops={tour.tour_places?.map(tp => tp.place) || []}/>

                            </DialogContent>
                        </Dialog>
                    </div>

                    {/*row 6*/}
                    <div className="flex flex-col gap-2">
                        <FieldLabel className="text-xl sm:text-2xl lg:text-3xl text-[#020765]">
                            Description
                        </FieldLabel>
                        <FieldLabel className="text-base text-neutral-700 whitespace-pre-line">
                            {tour.description}
                        </FieldLabel>

                        {/* MOVED: Reviews section is no longer here */}
                    </div>
                </div>

                {/* Booking Form Card */}
                {/* CHANGED: Spans 2 cols and 2 rows on desktop. Sticky. */}
                <Card
                    className="flex flex-col bg-neutral-50 w-full max-w-lg mx-auto lg:w-lg md:max-w-none md:col-span-2 md:row-span-2 md:sticky top-23 rounded-4xl h-fit">
                    <CardHeader>
                        <CardTitle className="flex flex-col items-center justify-center gap-2 p-3">
                            <div className="flex items-center justify-between">

                                {/* 2. THE STATUS BADGE: Added as a new, separate element. */}
                                {/* This uses the same soft, clean style as your tour tags. */}
                                {achievements.includes("Budget") && (
                                    <span
                                        className="rounded-full bg-rose-100 px-1 py-0.5 text-[10px] font-medium text-rose-700 -mt-6 -mr-1">
                                        Budget
                                    </span>
                                )}
                                {achievements.includes("Luxury") && (
                                    <span
                                        className="ml-3 rounded-full bg-sky-100 px-1 py-0.5 text-[10px] font-medium text-[#60a5fa] -mt-6 -mr-1">
                                        Luxury
                                    </span>
                                )}
                                {/* 1. THE PRICE: No longer has conditional colors. */}
                                <FieldLabel
                                    className={cn(
                                        // Kept your font-normal preference
                                        "text-3xl sm:text-4xl font-medium",
                                    )}
                                >
                                    {currency === "VND"
                                        ? `${(tour.price * (groupsize || tour.min_people)).toLocaleString()} VND`
                                        : `$${((tour.price * (groupsize || tour.min_people)) / 25000).toFixed(2)} USD`}
                                </FieldLabel>
                                {/* 3. THE BUTTON: Unchanged, but now spaced correctly. */}
                                <Button
                                    size="icon"
                                    onClick={() => setCurrency(currency === "VND" ? "USD" : "VND")}
                                    className="-mb-1 scale-80 transition-transform border-0 bg-white rounded-full hover:scale-85 hover:bg-neutral-200"
                                >
                                    <ArrowRightLeft color="black" className="w-full h-full"/>
                                </Button>
                            </div>
                            <FieldLabel className="text-neutral-500 font-light text-base">includes all fees</FieldLabel>
                        </CardTitle>
                    </CardHeader>


                    <CardContent className="flex flex-col gap-2">
                        {/* ... (All booking card content remains unchanged) ... */}
                        <div className="flex justify-between items-center p-3">
                            <div className="flex items-center gap-2 text-lg text-neutral-600 sm:text-xl">
                                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"/>
                                <span>Max group size:</span>
                            </div>
                            <FieldLabel
                                className="text-lg sm:text-xl text-[#23C491] font-medium text-right">{tour.min_people} - {tour.max_people} people</FieldLabel>
                        </div>

                        <div className="flex justify-between items-center p-3">
                            <div className="flex items-center gap-2 text-lg text-neutral-600 sm:text-xl">
                                <Clock className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"/>
                                <span>Duration:</span>
                            </div>
                            <FieldLabel className="text-lg sm:text-xl text-[#23C491] font-medium text-right">Up
                                to {tour.duration} hours</FieldLabel>
                        </div>

                        <div className="flex justify-between items-center p-3">
                            <div className="flex items-center gap-2 text-lg text-neutral-600 sm:text-xl">
                                {tour.transportation === "walk" &&
                                    <Footprints className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"/>}
                                {tour.transportation === "private" &&
                                    <MotorbikeIcon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"/>}
                                {tour.transportation === "public" &&
                                    <BusFront className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"/>}
                                <span>Transportation:</span>
                            </div>
                            <FieldLabel className="text-lg sm:text-xl text-[#23C491] font-medium capitalize text-right">
                                {tour.transportation === "walk" && "walking"}
                                {tour.transportation === "private" && "private transportation"}
                                {tour.transportation === "public" && "public transportation"}
                            </FieldLabel>
                        </div>

                        <div className="flex justify-between items-center p-3">
                            <div className="flex items-center gap-2 text-lg text-neutral-600 sm:text-xl">
                                <Pin className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0"/>
                                <span>Meeting location:</span>
                            </div>
                            <FieldLabel className="text-lg sm:text-xl text-[#23C491] font-medium text-right">
                                {tour.meeting_location}
                            </FieldLabel>
                        </div>

                        <br/>

                        <div className="flex flex-col gap-3 p-3">
                            <div
                                className="bg-white flex justify-between items-center border-neutral-300 border-2 width rounded-4xl p-3">
                                <FieldLabel className="text-lg sm:text-xl text-black">
                                    Group Size:
                                </FieldLabel>
                                <Input
                                    type="number"
                                    min={tour.min_people}
                                    max={tour.max_people}
                                    step={1}
                                    value={groupsize ?? tour.min_people}
                                    onChange={(e) => {
                                        // allow free typing or clearing
                                        const value = e.target.value;
                                        setgroupsize(value === "" ? "" : Number(value));
                                    }}
                                    onBlur={() => {
                                        // clamp when user leaves the input
                                        if (groupsize === "" || isNaN(groupsize)) {
                                            setgroupsize(tour.min_people);
                                            return;
                                        }

                                        const clamped = Math.min(Math.max(groupsize, tour.min_people), tour.max_people);
                                        setgroupsize(clamped);
                                    }}
                                    className="w-30 sm:w-45 text-center rounded-3xl text-lg sm:text-xl font-bold text-[#23C491]"
                                />
                            </div>

                            <div
                                className="bg-white flex justify-between items-center border-neutral-300 border-2 width rounded-4xl p-3">
                                <FieldLabel className="text-lg sm:text-xl text-black">
                                    Tour Date:
                                </FieldLabel>
                                <Calendar22
                                    date={date ?? ""}
                                    onSelect={(e) => setdate(e)}
                                    buttonClassName="w-30 sm:w-45 text-center rounded-3xl text-base sm:text-md font-bold text-[#23C491]"
                                />
                            </div>

                            <div
                                className="bg-white flex justify-between items-center border-neutral-300 border-2 width rounded-4xl p-3">
                                <FieldLabel className="text-lg sm:text-xl text-black">
                                    Start Time:
                                </FieldLabel>
                                <Input
                                    type="time"
                                    value={time ?? ""}
                                    onChange={(e) => settime(e.target.value)}
                                    className="w-30 sm:w-45 text-center rounded-3xl text-lg sm:text-xl font-bold text-[#23C491]"
                                />
                            </div>
                        </div>
                        <br/>
                        <div className="relative w-full">

                            {/* 2. Conditionally render the "Popular" badge */}
                            {achievements.includes("Popular") && (
                                <span
                                    className="absolute -top-2.5 left-4 z-10 rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-semibold text-black shadow">
                                    <div className="flex justify-center gap-1 items-center">
                                        <Flame fill="black" stroke="black" className="w-3 h-3"/>
                                        Popular
                                    </div>

                                </span>
                            )}

                            {/* 3. The Button is NOW ALWAYS GREEN.
                                   We removed the conditional styles from the button itself. */}
                            <Button
                                className={cn(
                                    "text-xl sm:text-2xl rounded-4xl w-full h-fit py-3 transition-all duration-300",

                                    // This is now the *only* style, based on your DEFAULT state
                                    "bg-[#068F64] text-white hover:bg-[#23C491] hover:text-yellow-50 active:scale-[0.98] active:brightness-95",

                                    // Add a little top padding if it's popular, to make room for the badge
                                    achievements.includes("Popular") && "pt-4"
                                )}
                            >
                                REQUEST BOOKING
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Reviews Section */}
                {/* Reviews Section */}
                <div className="flex flex-col gap-4 md:col-span-3">
                    <FieldSeparator className="p-10"/>
                    <FieldLabel className="text-xl sm:text-2xl lg:text-3xl text-[#020765]">Reviews</FieldLabel>

                    {/* Section 2: Your Rating (Interactive) */}
                    <div className="mt-6">
                        {!hasRated ? (
                            <Dialog>
                                <DialogTitle/>
                                <DialogTrigger asChild>
                                    <Button
                                        className="bg-neutral-200 text-gray-600 w-full hover:bg-white hover:border-1 hover:border-neutral-400 hover:text-black">
                                        Write your review here
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="w-full sm:max-w-2xl shadow-xl rounded-xl">
                                    <DialogDescription/>
                                    <TourRate tourId={tourData.tour.id} onRatingSubmit={(newRating) => {
                                        // Refresh ratings after a new one is submitted
                                        setRatings((prev) => [newRating, ...prev]);
                                        setHasRated(true);
                                    }}/>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-yellow-500 text-2xl sm:text-3xl">{/* stars */}</span>
                                <span className="text-sm sm:text-base text-neutral-600">
                                  You have already rated this tour.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Display fetched ratings */}
                    {ratings.length > 0 ? (
                        <TourRating ratings={ratings}/>
                    ) : (
                        <p className="text-gray-500 mt-4">No reviews yet. Be the first to review!</p>
                    )}
                </div>
            </div>
        </div>
    );
}