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
    Plus, MessageSquarePlus, Flame, ArrowRightLeft,
    TreePalm,
    Sun,
    Mountain,
    BookOpen,
    MapPin,
    Users,
    Eye,
    Activity,
    Coffee,
    Moon,
    Home,
    ShoppingBag,
    Camera,
    Smile,
    Droplet,
    Leaf,
    Volleyball, Binoculars, Landmark, Palmtree, MoonStar, ShoppingCart, Pickaxe, Building, Telescope, Kayak,
    FerrisWheel,
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
import {useAuthStore} from "@/stores/useAuthStore.js";
import GuideSection from "@/components/TourPost/guidesection.jsx";
import {Link} from "react-router-dom";
// API
import {API_ENDPOINTS} from "@/constant";
import {tourService} from "@/services/tourService.js";
import TimeInput from "@/components/timeinput.jsx";
import MoreTourByGuide from "@/components/TourPost/more_tour_section.jsx";

const TOUR_TAG_ICONS = {
    "Nature": <Binoculars className="w-3 h-3"/>,
    "Beach": <Palmtree className="w-3 h-3"/>,
    "Trekking": <Mountain className="w-3 h-3"/>,
    "Culture": <BookOpen className="w-3 h-3"/>,
    "History": <Landmark className="w-3 h-3"/>,
    "Local Experience": <Users className="w-3 h-3"/>,
    "Sightseeing": <Telescope className="w-3 h-3"/>,
    "Adventure": <Pickaxe className="w-3 h-3"/>,
    "Food & Drink": <Coffee className="w-3 h-3"/>,
    "Nightlife": <MoonStar className="w-3 h-3"/>,
    "City Life": <Building className="w-3 h-3"/>,
    "Shopping": <ShoppingCart className="w-3 h-3"/>,
    "Photography": <Camera className="w-3 h-3"/>,
    "Relaxation": <Smile className="w-3 h-3"/>,
    "Water Sports": <Kayak className="w-3 h-3"/>,
    "Countryside": <Leaf className="w-3 h-3"/>,
    "Recreational": <FerrisWheel className="w-3 h-3"/>,
};
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
export default function TourPost() {
    const userRole = useAuthStore((state) => state.user?.role);
    const isLoggedIn = useAuthStore((state) => !!state.user);
    const {tour_id} = useParams();
    const [tourData, setTourData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState("USD");
    const [groupsize, setgroupsize] = useState(null);
    const [date, setdate] = useState(null);
    const [time, settime] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [hasRated, setHasRated] = useState(false);
    const [achievements, setAchievements] = useState([]);

    // Fetch from backend (unchanged)
    useEffect(() => {
        async function fetchTour() {
            if (!tour_id) return;

            setLoading(true);
            const result = await tourService.getTour(tour_id);

            if (result.success) {
                setTourData(result.data);
            }
            setLoading(false);
        }

        fetchTour();
    }, [tour_id]);

    useEffect(() => {
        async function fetchAchievements() {
            try {
                const res = await fetch(API_ENDPOINTS.GET_TOUR_ACHIEVEMENTS(tour_id));
                const data = await res.json();
                setAchievements(data.achievements || []);

            } catch (err) {
                console.error("Failed to fetch achievements:", err);
            }
        }

        if (tour_id) fetchAchievements();
    }, [tour_id]);

    useEffect(() => {
        async function fetchRatings() {
            if (!tour_id) return;

            const result = await tourService.getRatings(tour_id);
            if (result.success) {
                setRatings(result.data.ratings || []);
            }
        }

        fetchRatings();
    }, [tour_id]);

    if (loading) return <p className="text-center p-4">Loading tour...</p>;
    if (!tourData) return <p className="text-center p-4">Tour not found.</p>;

    const {tour} = tourData;
    const averageRating = tour.rating_count > 0 ? (tour.rating_total / tour.rating_count).toFixed(1) : 0;

    return (
        <div className="items-center">
            {/* CHANGED: Tighter container and less vertical margin */}
            <div
                className="grid grid-cols-1 md:grid-cols-5 gap-y-6 md:gap-x-8 lg:gap-x-24 max-w-6xl mx-auto px-4 my-24">

                {/* Main Content Area */}
                {/* (No changes in this section) */}
                <div className="flex w-full flex-col gap-6 md:col-span-3">

                    {/*row 1*/}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-10 gap-4">

                            {/* Tour Name */}
                            <FieldLabel
                                className="
                                  font-bold text-[#020765]
                                  text-3xl sm:text-4xl lg:text-5xl
                                  max-w-full
                                  break-words
                                  leading-snug
                                "
                            >
                                {tour.name}
                            </FieldLabel>

                            {/* Achievements */}
                            <div className="flex flex-wrap justify-start sm:justify-end w-full sm:w-auto gap-2 sm:mt-2">
                                {achievements.map((ach) => (
                                    <AchievementBadge
                                        key={ach}
                                        variant={ACHIEVEMENT_VARIANTS[ach]}
                                        label={ach}
                                    />
                                ))}
                            </div>
                        </div>
                        {tour.tags.map((tag, index) => (
                            <span key={index} className="mr-2">
                            <Badge
                                variant={TOUR_TAG_VARIANTS[tag] || "default"}
                                className="cursor-pointer inline-flex items-center gap-1"
                            >
                              {TOUR_TAG_ICONS[tag] && (
                                  <span className="flex-shrink-0">
                                  {TOUR_TAG_ICONS[tag]}
                                </span>
                              )}
                                {tag}
                            </Badge>
                          </span>
                        ))}

                    </div>


                    {/*row 2*/}
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
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
                        <GuideSection guide={tour.guide}/>
                    </div>

                    {/*row 5*/}
                    <div className="flex flex-col gap-4 mt-4">
                        <FieldLabel className="text-xl sm:text-2xl lg:text-3xl text-[#020765]">
                            Tour Schedule
                        </FieldLabel>


                        <Dialog>
                            <DialogTitle/>
                            <DialogTrigger asChild>
                                <button>
                                    <TourStopsTimeline stops={tour.tour_places?.map(tp => tp.place) || []}/>
                                </button>
                            </DialogTrigger>
                            <DialogContent className="w-full sm:max-w-4xl">
                                <DialogDescription/>
                                <TourRoute Stops={tour.tour_places?.map(tp => tp.place) || []}/>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/*row 6*/}
                    <div className="flex flex-col gap-9">
                        <FieldLabel className="text-xl sm:text-2xl lg:text-3xl text-[#020765]">
                            Description
                        </FieldLabel>
                        <FieldLabel className="text-base text-neutral-700 whitespace-pre-line leading-loose">
                            {tour.description}
                        </FieldLabel>
                        {/* MOVED: Reviews section is no longer here */}
                    </div>
                </div>

                {/* Booking Form Card */}
                {/* CHANGED: Removed 'lg:w-md' for correct responsive scaling */}
                <Card
                    // CHANGED: Removed md:max-h-[...] and md:overflow-y-auto to remove the scrollbar
                    // CHANGED: Standardized top-23 to top-24
                    className="flex flex-col bg-neutral-50 w-full max-w-lg mx-auto md:max-w-none md:col-span-2 md:row-span-2 md:sticky top-26 rounded-3xl h-fit">
                    <CardHeader>
                        <CardTitle className="flex flex-col items-center justify-center -mb-4">
                            <div className="flex items-center justify-between">

                                {/* THE STATUS BADGE (only Budget or Luxury) */}
                                <span
                                    className={cn(
                                        "rounded-full px-1 py-0.5 -mt-6 -mr-1 text-[10px] font-medium",
                                        achievements.includes("Budget")
                                            ? "bg-emerald-50 text-emerald-600"
                                            : achievements.includes("Luxury")
                                                ? "bg-sky-100 text-[#60a5fa]"
                                                : "invisible"
                                    )}
                                >
                                    {achievements.includes("Budget")
                                        ? "Budget"
                                        : achievements.includes("Luxury")
                                            ? "Luxury"
                                            : "Placeh"}
                                </span>

                                {/* THE PRICE */}
                                <FieldLabel
                                    className={cn(
                                        "text-center text-2xl sm:text-3xl font-medium",
                                    )}
                                >
                                    {currency === "VND"
                                        ? `${(tour.price * (groupsize || tour.min_people)).toLocaleString()} VND`
                                        : `$${((tour.price * (groupsize || tour.min_people)) / 25000).toFixed(2)} USD`}
                                </FieldLabel>

                                {/* THE BUTTON */}
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
                    <FieldSeparator className="h-0"/>
                    {/* Using the more compact layout from the previous step */}
                    <CardContent className="flex flex-col">
                        <div className="flex justify-between items-center p-1">
                            <div className="flex items-center gap-2 text-md text-neutral-600 sm:text-lg">
                                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                                <span>Max group size:</span>
                            </div>
                            <FieldLabel
                                className="text-md text-[#333333] font-medium text-right">{tour.min_people} - {tour.max_people} people</FieldLabel>
                        </div>

                        <div className="flex justify-between items-center p-1">
                            <div className="flex items-center gap-2 text-md text-neutral-600 sm:text-lg">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                                <span>Duration:</span>
                            </div>
                            <FieldLabel className="text-md text-[#333333] font-medium text-right">Up
                                to {tour.duration} hours</FieldLabel>
                        </div>

                        <div className="flex justify-between items-center p-1">
                            <div className="flex items-center gap-2 text-md text-neutral-600 sm:text-lg">
                                {tour.transportation === "walk" &&
                                    <Footprints className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>}
                                {tour.transportation === "private" &&
                                    <MotorbikeIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>}
                                {tour.transportation === "public" &&
                                    <BusFront className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>}
                                <span>Transportation:</span>
                            </div>
                            <FieldLabel className="text-md text-[#333333] font-medium capitalize text-right">
                                {tour.transportation === "walk" && "walking"}
                                {tour.transportation === "private" && "private "}
                                {tour.transportation === "public" && "public "}
                            </FieldLabel>
                        </div>

                        <div className="flex justify-between items-center p-1">
                            <div className="flex items-center gap-2 text-md text-neutral-600 sm:text-lg">
                                <Pin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"/>
                                <span>Meeting location:</span>
                            </div>
                            <FieldLabel className="text-md text-[#333333] font-medium text-right">
                                {tour.meeting_location === "mine" && "My Place"}
                                {tour.meeting_location === "yours" && "Your Place"}
                                {tour.meeting_location === "first" && "First Stop"}
                            </FieldLabel>
                        </div>

                        {/* CHANGED: Made input rows more compact (p-3 to p-2) */}
                        {userRole !== "guide" && (
                            <div className="flex flex-col gap-2 p-1 mt-3 mb-3">
                                <div
                                    className="bg-white flex justify-between items-center border-neutral-300 border-1 width rounded-4xl p-1">
                                    <FieldLabel className="text-md sm:text-lg text-black px-2">
                                        Group Size:
                                    </FieldLabel>
                                    <Input
                                        type="number"
                                        min={tour.min_people}
                                        max={tour.max_people}
                                        step={1}
                                        value={groupsize ?? tour.min_people}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setgroupsize(value === "" ? "" : Number(value));
                                        }}
                                        onBlur={() => {
                                            if (groupsize === "" || isNaN(groupsize)) {
                                                setgroupsize(tour.min_people);
                                            }
                                            const clamped = Math.min(
                                                Math.max(groupsize, tour.min_people),
                                                tour.max_people
                                            );
                                            setgroupsize(clamped);
                                        }}
                                        className="w-35 sm:w-40 text-center rounded-3xl text-sm sm:text-md font-bold text-[#23C491]"
                                    />
                                </div>

                                <div
                                    className="bg-white flex justify-between items-center border-neutral-300 border-1 width rounded-4xl p-1">
                                    <FieldLabel className="text-md sm:text-lg text-black px-2">
                                        Tour Date:
                                    </FieldLabel>
                                    <Calendar22
                                        date={date ?? ""}
                                        onSelect={(e) => setdate(e)}
                                        buttonClassName="w-35 sm:w-40 text-center rounded-3xl text-sm sm:text-md font-bold text-[#23C491]"
                                    />
                                </div>

                                <div
                                    className="bg-white flex justify-between items-center border-neutral-300 border-1 width rounded-4xl p-1">
                                    <FieldLabel className="text-md sm:text-lg text-black px-2">
                                        Start Time:
                                    </FieldLabel>
                                    {/*<Input*/}
                                    {/*    type="time"*/}
                                    {/*    value={time ?? ""}*/}
                                    {/*    onChange={(e) => settime(e.target.value)}*/}
                                    {/*    className="w-30 sm:w-45 text-center rounded-3xl text-lg sm:text-xl font-bold text-[#23C491]"*/}
                                    {/*/>*/}
                                    <TimeInput
                                        value={time ?? ""}
                                        onChange={(e) => settime(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}


                        {/* CHANGED: Reduced margin-top (mt-4 to mt-2) */}
                        {userRole !== "guide" && (
                            <div className="relative w-full mt-2">

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

                                {/* 3. The Button */}
                                <Button
                                    onClick={() => {
                                        if (!isLoggedIn) {
                                            window.location.href = "/login";
                                            console.log("not logged");// redirect nếu chưa login
                                        } else {
                                            console.log("logged");// handle booking logic
                                        }
                                    }}
                                    className={cn(
                                        "text-lg sm:text-xl rounded-4xl w-full h-fit py-3 transition-all duration-300",
                                        "bg-[#068F64] text-white hover:bg-[#23C491] hover:text-yellow-50 active:scale-[0.98] active:brightness-95",
                                        achievements.includes("Popular") && "pt-4"
                                    )}
                                >
                                    REQUEST BOOKING
                                </Button>
                            </div>
                        )}

                    </CardContent>
                </Card>

                {/* Reviews Section */}
                {/* (No changes in this section) */}
                <div className="flex flex-col gap-4 md:col-span-3">
                    {/* Section 2: Your Rating (Interactive) */}
                    <div className="mt-6">
                        {!hasRated && userRole !== "guide" ? (
                            userRole ? ( // Logged in user
                                <Dialog>
                                    <DialogTitle/>
                                    <DialogTrigger asChild>
                                        <Button
                                            className="bg-neutral-200 text-gray-600 w-full hover:bg-white hover:border-1 hover:border-neutral-400 hover:text-black">
                                            Write your review here
                                        </Button>
                                    </DialogTrigger>

                                    <DialogContent className="w-full sm:max-w-[45rem] shadow-xl rounded-xl break-words">
                                        <DialogDescription/>
                                        <TourRate
                                            tourId={tourData.tour.id}
                                            onRatingSubmit={(newRating) => {
                                                setRatings((prev) => [newRating, ...prev]);
                                                setHasRated(true);
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            ) : ( // Guest → Link to login
                                <Link to="/login" className="w-full">
                                    <Button
                                        className="bg-neutral-200 text-gray-600 w-full hover:bg-white hover:border-1 hover:border-neutral-400 hover:text-black">
                                        Write your review here
                                    </Button>
                                </Link>
                            )
                        ) : hasRated ? (
                            <div className="flex items-center gap-2">
                                <span className="text-yellow-500 text-2xl sm:text-3xl">{/* stars */}</span>
                                <span className="text-sm sm:text-base text-neutral-600">
                                    You have already rated this tour.
                                  </span>
                            </div>
                        ) : null}
                    </div>
                    <FieldSeparator className="p-10"/>
                    <FieldLabel className="text-xl sm:text-2xl lg:text-3xl text-[#020765]">Reviews</FieldLabel>


                    {/* Display fetched ratings */}
                    {ratings.length > 0 ? (
                        <div className="break-words whitespace-normal max-w-full">
                            <TourRating ratings={ratings}/>
                        </div>
                    ) : (
                        <p className="text-gray-500 mt-4">No reviews yet. Be the first to review!</p>
                    )}
                </div>

            </div>
            <div className="mb-10">
                <MoreTourByGuide guide={tour.guide} currentTourId={tour.id}/>
            </div>

        </div>
    );
}