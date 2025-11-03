import {TourRoute} from "@/components/Map.jsx";
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
import TourCarousel from "@/components/tourcarousel.jsx";
import {Calendar22} from "@/components/ui/datepicker.jsx";
import TourStopsTimeline from "@/components/stoptimeline.jsx";
import {useParams} from "react-router-dom";
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";
import {Badge} from "@/components/ui/badge.jsx";

export default function TourPost({tourId: propTourId}) {
    const {id} = useParams();
    const tourId = id || propTourId;
    const [tourData, setTourData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState("VND");
    const [groupsize, setgroupsize] = useState(null);
    const [date, setdate] = useState(null);
    const [time, settime] = useState(null);
    const [myRating, setMyRating] = useState(0);
    const [hasRated, setHasRated] = useState(false);
    // Fetch from backend (unchanged)
    useEffect(() => {
        async function fetchTour() {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/tourpost/${tourId}/`);
                const data = await res.json();
                setTourData(data);
            } catch (err) {
                console.error("Failed to load tour:", err);
            } finally {
                setLoading(false);
            }
        }

        if (tourId) fetchTour();
    }, [tourId]);

    if (loading) return <p className="text-center p-4">Loading tour...</p>;
    if (!tourData) return <p className="text-center p-4">Tour not found.</p>;

    const {tour} = tourData;
    const averageRating = tour.rates > 0 ? tour.rating / tour.rates : 0;

    return (
        <div className="items-center">
            <Header/>
            {/* CHANGED: Switched to CSS Grid for layout control */}
            <div
                className="grid grid-cols-1 md:grid-cols-5 gap-y-6 md:gap-x-8 lg:gap-x-25 max-w-7xl mx-auto py-6 px-4 mt-40 mb-40">

                {/* Main Content Area */}
                {/* CHANGED: On desktop, spans 3 of 5 columns */}
                <div className="flex w-full flex-col gap-6 md:col-span-3">

                    {/*row 1*/}
                    <div>
                        <FieldLabel className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5">
                            {tour.name}
                        </FieldLabel>

                        {tour.tags.map((tag,index)=>
                            (
                                <span key={index} className="mr-2">
                                    <Badge
                                        variant="brightgreen"
                                        className="cursor-pointer"
                                      >
                                        {tag}
                                      </Badge>
                                </span>
                            ))}
                    </div>


                    {/*row 2*/}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Star Rating */}
                        <Rating value={averageRating} readOnly>
                            {Array.from({length: 5}).map((_, index) => (
                                <RatingButton
                                    key={index}
                                    className={`text-yellow-500 text-3xl sm:text-4xl`}
                                />
                            ))}
                        </Rating>
                        {/* Number of votes */}
                        <span className="text-gray-600 text-base sm:text-lg">
                     {averageRating} ({tour.rates} votes)
                    </span>
                    </div>

                    {/*row 3*/}
                    <div className="flex justify-start">
                        <TourCarousel images={tourData.images}/>
                    </div>

                    {/*row 4*/}
                    <div className="mt-4">
                        <Card className="w-full bg-neutral-200 rounded-4xl h-24"/>
                    </div>

                    {/*row 5*/}
                    <div className="flex flex-col gap-4 mt-4">
                        <FieldLabel className="text-xl sm:text-2xl lg:text-3xl">
                            Tour Schedule
                        </FieldLabel>
                        <TourStopsTimeline
                            stops={tour.places}
                        />
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline"
                                        className="w-full sm:w-auto rounded-2xl text-white bg-black text-xl">View Tour
                                    Route</Button>
                            </DialogTrigger>
                            <DialogContent className="w-full sm:max-w-4xl">
                                <TourRoute
                                    Stops={tour.places}/>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/*row 6*/}
                    <div className="flex flex-col gap-2">
                        <FieldLabel className="text-xl sm:text-2xl lg:text-3xl">
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
                    className="flex flex-col w-full max-w-lg mx-auto lg:w-lg md:max-w-none md:col-span-2 md:row-span-2 md:sticky top-23 rounded-4xl h-fit">
                    <CardHeader>
                        <CardTitle className="flex flex-col items-center justify-center gap-2 p-3">
                            <div className="flex items-center">
                                <FieldLabel className="text-3xl sm:text-4xl">
                                    {currency === "VND"
                                        ? `${(tour.price * (groupsize || tour.min_people)).toLocaleString()} VND`
                                        : `$${((tour.price * (groupsize || tour.min_people)) / 25000).toFixed(2)} USD`}
                                </FieldLabel>

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setCurrency(currency === "VND" ? "USD" : "VND")}
                                    className="transition-transform hover:rotate-12 hover:scale-110"
                                >
                                    <RefreshCw/>
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
                                className="flex justify-between items-center border-neutral-300 border-2 width rounded-4xl p-3">
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
                                className="flex justify-between items-center border-neutral-300 border-2 width rounded-4xl p-3">
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
                                className="flex justify-between items-center border-neutral-300 border-2 width rounded-4xl p-3">
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
                        <div className="p-3">
                            <Button
                                className="bg-[#068F64] text-white text-xl sm:text-2xl rounded-4xl w-full h-fit hover:bg-[#23C491] hover:text-yellow-50 py-3">
                                REQUEST BOOKING
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Reviews Section */}
                <div className="flex flex-col gap-4 md:col-span-3">
                    <FieldSeparator className="p-10"/>

                    <FieldLabel className="text-xl sm:text-2xl lg:text-3xl">
                        Reviews
                    </FieldLabel>
                    {/* Section 2: Your Rating (Interactive) */}
                    <div className="flex justify-start gap-10">
                        <div>
                            <FieldLabel className="text-base text-neutral-600">
                                Leave Your Rating
                            </FieldLabel>

                            {/* CHANGED: Added readOnly={hasRated} */}
                            <Rating value={myRating} onValueChange={setMyRating} readOnly={hasRated}>
                                {Array.from({length: 5}).map((_, index) => (
                                    <RatingButton
                                        key={index}
                                        className={`text-yellow-500 text-3xl sm:text-4xl ${hasRated ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
                                    />
                                ))}
                            </Rating>
                        </div>
                        {!hasRated && (
                            <Button
                                onClick={() => {
                                    // --- This is the new logic ---

                                    // 1. Calculate the new totals
                                    const newTotalRating = tourData.tour.rating + myRating;
                                    const newTotalRates = tourData.tour.rates + 1;

                                    // 2. Update the local tourData state
                                    // This causes the component to re-render and recalculate averageRating
                                    setTourData(prevTourData => ({
                                        ...prevTourData, // Copy all existing data (like images)
                                        tour: {
                                            ...prevTourData.tour, // Copy all existing tour data
                                            rating: newTotalRating, // Overwrite with new total rating
                                            rates: newTotalRates     // Overwrite with new total rates
                                        }
                                    }));

                                    // 3. (Optional but recommended) Send this 'myRating' to your backend API
                                    // fetch(`http://127.0.0.1:8000/api/tourpost/${tourId}/rate/`, { ... })

                                    // 4. Lock the rating section
                                    setHasRated(true);

                                    // 5. Show toast
                                    toast.success(`You submitted a ${myRating} star rating!`);
                                }}
                                className="sm:w-auto mt-2 bg-[#068F64] hover:bg-white hover:text-black hover:border-black hover:border-1 text-white rounded-2xl"
                            >
                                Submit Rating
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    );
}