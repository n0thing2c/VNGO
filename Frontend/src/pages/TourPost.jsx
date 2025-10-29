import {TourRoute} from "@/components/Map.jsx";
import {use, useState} from "react";
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

export default function TourPost({tourId}) {
    const [tourData, setTourData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState("VND"); // <-- currency state
    const [groupsize, setgroupsize] = useState(1);
    const [date, setdate] = useState(null);
    const [time, settime] = useState(null);
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
        <div className="flex flex-col gap-y-4 gap-x-25 md:flex-row justify-center items-start px-4">
            <div className="flex flex-col gap-5">
                {/*row 1*/}
                <FieldLabel className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold">
                    {tour.name}
                </FieldLabel>
                {/*row 2*/}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Star Rating */}
                    <Rating value={averageRating} readOnly>
                        {Array.from({length: 5}).map((_, index) => (
                            <RatingButton
                                key={index}
                                className={`text-yellow-500 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl`}
                            />
                        ))}
                    </Rating>
                    {/* Number of votes */}
                    <span className="text-gray-600 text-lg sm:text-xl">
                     ({tour.rates} votes)
                    </span>
                </div>
                {/*row 3*/}
                <div className="flex justify-start">
                    <TourCarousel images={tourData.images}/>
                </div>
                {/*row 4*/}
                <div>
                    <Card className="w-full bg-neutral-200 rounded-4xl">
                        <CardContent>
                            <br/>
                            <br/>
                            <br/>
                        </CardContent>
                    </Card>
                </div>
                {/*row 5*/}
                <div>
                    <TourStopsTimeline
                        stops={tour.places}
                    />
                    <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline">View Tour Route</Button>
                            </DialogTrigger>
                            <DialogContent className="w-full">
                                <TourRoute
                                Stops={tour.places}/>
                            </DialogContent>
                    </Dialog>

                </div>
                {/*row 6*/}
                <div>
                    <FieldLabel className="text-3xl font-bold">
                        Description
                    </FieldLabel>
                    <FieldLabel className="text-xl font-thin">
                        {tour.description}
                    </FieldLabel>
                </div>
            </div>

            <Card
                className="flex justify-end sticky top-23 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-[32rem] rounded-4xl">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center justify-center gap-2 p-3">
                        <div className="flex items-center">
                            <FieldLabel className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
                                {currency === "VND" ? tour.price.toLocaleString() + " VND" : `$${(tour.price / 25000).toFixed(2) + " USD"}`}
                            </FieldLabel>
                            {/* Currency toggle icon */}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setCurrency(currency === "VND" ? "USD" : "VND")}
                                className="transition-transform hover:rotate-12 hover:scale-110"
                            >
                                <RefreshCw/>
                            </Button>
                        </div>
                        <FieldLabel className="text-neutral-500 font-light">includes all fees</FieldLabel>
                    </CardTitle>
                </CardHeader>


                <CardContent className="flex flex-col">
                    <div>

                    </div>
                    <div className="flex justify-between p-3">
                        <FieldLabel className="text-2xl text-neutral-600">
                            <UserPlus className="text-2xl text-neutral-600"/>
                            Max group size:
                        </FieldLabel>
                        <div className="flex justify-end">
                            <FieldLabel
                                className="text-2xl text-[#23C491]">{tour.min_people} - {tour.max_people} people</FieldLabel>
                        </div>
                    </div>

                    <div className="flex justify-between p-3">
                        <FieldLabel className="text-2xl text-neutral-600">
                            <Clock className="text-2xl text-neutral-600"/>
                            Duration:
                        </FieldLabel>
                        <div className="flex justify-end">
                            <FieldLabel className="text-2xl text-[#23C491]">Up to {tour.duration} hours</FieldLabel>
                        </div>
                    </div>

                    <div className="flex justify-between p-3">
                        <FieldLabel className="text-2xl text-neutral-600">
                            {tour.transportation === "walk" && <Footprints className="text-2xl text-neutral-600"/>}
                            {tour.transportation === "private" &&
                                <MotorbikeIcon className="text-2xl text-neutral-600"/>}
                            {tour.transportation === "public" && <BusFront className="text-2xl text-neutral-600"/>}
                            Transportation:
                        </FieldLabel>
                        <div className="flex justify-end">
                            <FieldLabel className="text-2xl text-[#23C491]">
                                {tour.transportation}
                            </FieldLabel>
                        </div>
                    </div>
                    <div className="flex justify-between p-3">
                        <FieldLabel className="text-2xl text-neutral-600">
                            <Pin className="text-2xl text-neutral-600"/>
                            Meeting location:
                        </FieldLabel>
                        <div className="flex justify-end">
                            <FieldLabel className="text-2xl text-[#23C491]">
                                {tour.meeting_location}
                            </FieldLabel>
                        </div>
                    </div>
                    <br/>
                    <div className="flex flex-col gap-3 p-3">
                        <div className="flex justify-between border-neutral-300 border-3 width rounded-4xl p-3">
                            <FieldLabel className="text-2xl text-black">
                                Group Size:
                            </FieldLabel>
                            <Input
                                type="number"
                                min={1}
                                max={15} // optional max
                                step={1}
                                value={groupsize}
                                onChange={(e) => setgroupsize(Number(e.target.value))}
                                className="w-50 text-center rounded-3xl text-2xl font-bold text-[#23C491]"
                            />
                        </div>

                        <div className="flex justify-between border-neutral-300 border-3 width rounded-4xl p-3">
                            <FieldLabel className="text-2xl text-black">
                                Tour Date:
                            </FieldLabel>
                            <Calendar22
                                date={date}
                                onSelect={(e) => setdate(e)}
                                buttonClassName="w-50 text-center rounded-3xl text-md font-bold text-[#23C491]"
                            />
                        </div>

                        <div className="flex justify-between border-neutral-300 border-3 width rounded-4xl p-3">
                            <FieldLabel className="text-2xl text-black">
                                Start Time:
                            </FieldLabel>
                            <Input
                                type="time"
                                value={time}
                                onChange={(e) => settime(e.target.value)}
                                className="w-50 text-center rounded-3xl text-xl font-bold text-[#23C491]"
                            />
                        </div>
                    </div>
                    <br/>
                    <div className="p-3">
                        <Button
                            className="bg-[#068F64] text-white text-2xl rounded-3xl w-full h-fit hover:bg-[#23C491] hover: text-yellow-50">
                            REQUEST BOOKING
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}