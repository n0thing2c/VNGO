import {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {FieldLabel, FieldSeparator} from "@/components/ui/field";
import {Input} from "@/components/ui/input";
import {
    IdCard,
    MotorbikeIcon,
    Clock,
    UserPlus,
    Tag,
    PictureInPicture2Icon,
    Pin,
    CarFront,
    BusFront,
    Footprints,
    CircleDollarSignIcon,
    Edit2,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import TagSelector from "@/components/tagsselector.jsx";
import VNDInput from "@/components/priceinput.jsx";
import {Textarea} from "@/components/ui/textarea.jsx";
import ImageUploader from "@/components/imageuploader.jsx";
import DragList from "@/components/drag_list.jsx";
import {toast} from "sonner";
import Map from "../components/APIs/Map.jsx";
import {Links, Link} from "react-router-dom";
import {useAuthStore} from "@/stores/useAuthStore.js";
import {useNavigate} from "react-router-dom";
import {tourService} from "@/services/tourService.js";

export default function TourEdit() {
    const navigate = useNavigate();
    const user_name = useAuthStore((state) => state.user.username)
    const {tour_id} = useParams();
    const [loading, setLoading] = useState(true);
    const [tourData, setTourData] = useState(null);

    // --- State from TourCreate ---
    const [tourname, settourname] = useState("");
    const [hour, sethour] = useState(1);
    const [minpeople, setminpeople] = useState(1);
    const [maxpeople, setmaxpeople] = useState(1);
    const [transportation, setTransportation] = useState("");
    const [meeting, setMeeting] = useState("");
    const [price, setprice] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [description, setdescription] = useState("");
    const [addedStops, setAddedStops] = useState([]);
    const [imageData, setImageData] = useState({images: [], thumbnailIdx: 0});

    // ✅ STEP 1: Add new state to track removed images
    const [removedImageUrls, setRemovedImageUrls] = useState([]);

    // --- Constants from TourCreate ---
    const min_people = 1;
    const max_people = 15;
    const min_hour = 1;
    const max_hour = 24;

    const TagList = [
        "Nature",
        "Culture",
        "History",
        "Adventure",
        "Relaxation",
        "Food & Drink",
        "Nightlife",
        "Beach",
        "City Life",
        "Trekking",
        "Local Experience",
        "Sightseeing",
        "Shopping",
        "Photography",
        "Water Sports",
        "Countryside",
        "Recreational",
    ];
    // const TOUR_TAG_VARIANTS = {
    //     "Nature": "brightgreen",
    //     "Beach": "sand",
    //     "Trekking": "aqua",
    //     "Culture": "bluelavender",
    //     "History": "mustard",
    //     "Local Experience": "mint",
    //     "Sightseeing": "teal",
    //     "Adventure": "destructive",
    //     "Food & Drink": "coral",
    //     "Nightlife": "violet",
    //     "City Life": "orange",
    //     "Shopping": "pink",
    //     "Photography": "default",
    //     "Relaxation": "lime",
    //     "Water Sports": "sky",
    //     "Countryside": "olive",
    //     "Recreational": "peach",
    const TOUR_TAG_STYLES = {
        Nature: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-transparent",
        Beach: "bg-sky-100 text-sky-800 hover:bg-sky-200 border-transparent",
        Trekking: "bg-stone-100 text-stone-800 hover:bg-stone-200 border-transparent",
        Culture: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-transparent",
        History: "bg-amber-100 text-amber-800 hover:bg-amber-200 border-transparent",
        "Local Experience": "bg-teal-100 text-teal-800 hover:bg-teal-200 border-transparent",
        Sightseeing: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent",
        Adventure: "bg-rose-100 text-rose-800 hover:bg-rose-200 border-transparent",
        "Food & Drink": "bg-orange-100 text-orange-800 hover:bg-orange-200 border-transparent",
        Nightlife: "bg-violet-100 text-violet-800 hover:bg-violet-200 border-transparent",
        "City Life": "bg-slate-100 text-slate-800 hover:bg-slate-200 border-transparent",
        Shopping: "bg-pink-100 text-pink-800 hover:bg-pink-200 border-transparent",
        Photography: "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border-transparent",
        Relaxation: "bg-lime-100 text-lime-800 hover:bg-lime-200 border-transparent",
        "Water Sports": "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 border-transparent",
        Countryside: "bg-green-100 text-green-800 hover:bg-green-200 border-transparent",
        Recreational: "bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200 border-transparent",
    };

    const getTransportationIcon = (value) => {
        switch (value) {
            case "private":
                return <MotorbikeIcon/>;
            case "public":
                return <BusFront/>;
            case "walk":
                return <Footprints/>;
            default:
                return <CarFront/>;
        }
    };

    // --- Handlers from TourCreate ---

    const handleImageChange = (newImages, newThumbIdx) => {
        // Track removed images
        const currentOldUrls = imageData.images.filter((img) => img.url).map((img) => img.url);
        const newOldUrls = newImages.filter((img) => img.url).map((img) => img.url);
        const justRemovedUrls = currentOldUrls.filter(url => !newOldUrls.includes(url));

        if (justRemovedUrls.length > 0) {
            setRemovedImageUrls((prev) => {
                const updated = [...prev];
                justRemovedUrls.forEach((url) => {
                    if (!updated.includes(url)) updated.push(url);
                });
                return updated;
            });
        }

        // --- AUTO SET THUMBNAIL IF NONE EXIST ---
        let thumbnailIndex = newThumbIdx;
        if (newImages.length > 0) {
            const hasThumbnail = newImages.some(img => img.isThumbnail);
            if (!hasThumbnail) {
                thumbnailIndex = 0;
                newImages[0].isThumbnail = true;
            }
        }

        setImageData({images: newImages, thumbnailIdx: thumbnailIndex});
    };


    const handleAddStop = (newStop) => {
        setAddedStops((prevStops) => {
            const existingIndex = prevStops.findIndex(
                (stop) => stop.lat === newStop.lat && stop.lon === newStop.lon
            );

            if (existingIndex !== -1) {
                const updatedStops = [...prevStops];
                updatedStops[existingIndex] = {...prevStops[existingIndex], ...newStop};
                return updatedStops;
            }
            return [...prevStops, newStop];
        });
    };

    const handleRemoveStop = (index) => {
        setAddedStops((prev) => prev.filter((_, i) => i !== index));
    };

    const generateEnglishName = async (vietName) => {
        if (!vietName || vietName.trim() === "") return "";
        let englishName = vietName;
        try {
            const res = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(
                    vietName
                )}`
            );
            const data = await res.json();
            englishName = data[0][0][0];
        } catch (err) {
            console.error("Translation failed, using original name:", err);
        }
        return englishName;
    };

    const handleRenameStop = async (index, newName) => {
        const trimmedName = newName.trim();
        if (!trimmedName) return; // optionally skip empty

        const englishName = await generateEnglishName(trimmedName);

        setAddedStops((prevStops) =>
            prevStops.map((stop, i) =>
                i === index
                    ? {...stop, name: trimmedName, name_en: englishName}
                    : stop
            )
        );
    };

    const handleEditDescription = (index, newDescription) => {
        setAddedStops((prevStops) => {
            const updatedStops = [...prevStops];
            updatedStops[index] = {
                ...updatedStops[index],
                description: newDescription
            };
            return updatedStops;
        });
    };

    useEffect(() => {
        async function fetchTour() {
            if (!tour_id) return;

            setLoading(true);

            // Call the service
            const result = await tourService.getTour(tour_id);

            if (!result.success) {
                setLoading(false);
                return;
            }

            const tour = result.data.tour || result.data;

            // Check ownership
            if (tour.guide.username !== user_name) {
                toast.error("You cannot edit a tour that doesn't belong to you!");
                navigate("/"); // redirect if not owner
                setLoading(false);
                return;
            }

            const placesFromBackend = Array.isArray(tour.tour_places)
                ? tour.tour_places.map(tp => tp.place)
                : [];

            // Get descriptions from server (if available)
            let descriptionsFromBackend = [];
            if (Array.isArray(tour.stops_descriptions)) {
                descriptionsFromBackend = tour.stops_descriptions;
            } else if (typeof tour.stops_descriptions === 'string') {
                try {
                    descriptionsFromBackend = JSON.parse(tour.stops_descriptions);
                } catch (e) { descriptionsFromBackend = []; }
            }

            // Merge place and description into single object for addedStops
            const mergedStops = placesFromBackend.map((place, index) => ({
                ...place,
                description: descriptionsFromBackend[index] || "" // Get description by corresponding index
            }));

            // Pre-fill form fields
            setTourData(tour);
            settourname(tour.name || "");
            sethour(tour.duration || 1);
            setminpeople(tour.min_people || 1);
            setmaxpeople(tour.max_people || 1);
            setTransportation(tour.transportation || "");
            setMeeting(tour.meeting_location || "");
            setprice(tour.price || 0);
            setSelectedTags(Array.isArray(tour.tags) ? tour.tags : []);
            setdescription(tour.description || "");
            // setAddedStops(
            //     Array.isArray(tour.tour_places)
            //         ? tour.tour_places.map(tp => tp.place)
            //         : []
            // );
            setAddedStops(mergedStops);
            setImageData({
                images:
                    tour.tour_images?.map((img) => ({
                        url: img.image,
                        isThumbnail: img.isthumbnail,
                    })) || [],
                thumbnailIdx: tour.tour_images?.findIndex((i) => i.isthumbnail) ?? 0,
            });

            setLoading(false);
        }

        fetchTour();
    }, [tour_id]);

    if (loading)
        return <p className="text-center p-4">Loading tour data...</p>;
    if (!tourData)
        return <p className="text-center p-4">Tour not found.</p>;

    const handleSubmit = async () => {
        // Extract descriptions into string array to send to backend
        // Backend expects: stops_descriptions = ["desc 1", "desc 2", ...]
        const stopsDescriptions = addedStops.map((stop) => stop.description || "");
        const result = await tourService.updateTour({
            tour_id,
            tourname,
            hour,
            minpeople,
            maxpeople,
            transportation,
            meeting,
            addedStops,
            imageData,
            removedImageUrls,
            selectedTags,
            price,
            description,
            // Add this line (note: tourService.updateTour needs to be updated to accept this parameter)
            stops_descriptions: JSON.stringify(stopsDescriptions),
        });

        if (result.success) {
            setRemovedImageUrls([]);
            setTimeout(() => {
                navigate(`/tour/post/${tour_id}`);
            }, 1000);
        }
    };


    return (
        <div className="items-center">
            <div className="flex flex-col gap-6 md:flex-row justify-center items-start mt-20 mb-20 px-4">
                {/* LEFT CARD (MAP + TOUR SCHEDULE) */}
                <Card className="w-full max-w-lg sm:max-w-md lg:max-w-xl">
                    <CardHeader>
                        <CardTitle>
                            <h1 className="text-center text-lg sm:text-lg lg:text-2xl font-bold lg:p-4 md:p-3 sm:p-0">
                                EDIT TOUR PLACES
                            </h1>
                        </CardTitle>
                    </CardHeader>
                    <FieldSeparator className="h-0 mb-3"/>
                    <CardContent className="flex flex-col gap-6">
                        <div>
                            <Map
                                onLocationAdd={handleAddStop}
                                className="w-full h-60 md:h-70 xl:h-90 lg:h-80 sm:h-60"
                                addedStops={addedStops}
                            />
                        </div>
                        <FieldSeparator/>
                        <div className="space-y-4 w-full">
                            <div className="rounded-2xl border-[#068F64] border-2 p-3">
                                <FieldLabel className="text-md sm:text-sm lg:text-md text-[#068F64] font-bold">
                                    Tour Schedule
                                </FieldLabel>
                            </div>

                            <DragList
                                items={addedStops}
                                onRemoveItem={handleRemoveStop}
                                onReorder={setAddedStops}
                                onRenameItem={handleRenameStop}
                                onUpdateDescription={handleEditDescription}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* RIGHT CARD (EDIT FORM) */}
                <Card className="w-full max-w-lg sm:max-w-md lg:max-w-lg">
                    <CardHeader>
                        <CardTitle>
                            <h1 className="text-center text-lg sm:text-lg lg:text-2xl font-bold lg:p-4 md:p-3 sm:p-0">
                                EDIT TOUR INFO
                            </h1>
                        </CardTitle>
                    </CardHeader>
                    <FieldSeparator className="h-0 mb-3"/>
                    <CardContent className="flex flex-col gap-7 text-md">
                        {/* ROW 1: TOUR NAME */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-md flex items-center gap-1">
                                <IdCard className="w-5 h-5"/> Tour name:
                            </FieldLabel>
                            <Input
                                className="flex-1 py-2 xl:py-3 text-md "
                                value={tourname}
                                onChange={(e) => settourname(e.target.value)}
                            />
                        </div>


                        {/* ROW 2: DURATION */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-md flex items-center gap-1">
                                <Clock className="w-5 h-5" /> Duration:
                            </FieldLabel>
                            <div className="flex justify-end gap-3 items-center">
                                <FieldLabel className="hidden md:inline text-md">up to</FieldLabel>
                                <Input
                                    className="flex-1 text-center py-2 xl:py-3 text-md"
                                    type="number"
                                    value={hour}
                                    min={min_hour}
                                    max={max_hour}
                                    onChange={(e) => sethour(Number(e.target.value))}
                                    onBlur={(e) => {
                                        let value = parseInt(e.target.value, 10);
                                        if (isNaN(value)) value = min_hour;
                                        if (value > max_hour) value = max_hour;
                                        if (value < min_hour) value = min_hour;
                                        sethour(value);
                                    }}
                                />
                                <FieldLabel>hour(s)</FieldLabel>
                            </div>
                        </div>



                        {/* ROW 3: GROUP SIZE */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-md flex items-center gap-1">
                                <UserPlus className="w-5 h-5"/> Group size:
                            </FieldLabel>
                            <div className="flex justify-end gap-3 items-center">
                                <Input
                                    className="flex-1 text-center py-2 xl:py-3 text-md"
                                    type="number"
                                    value={minpeople}
                                    min={min_people}
                                    max={max_people}
                                    onChange={(e) => setminpeople(Number(e.target.value))}
                                    onBlur={(e) => {
                                        let minVal = parseInt(minpeople, 10);
                                        let maxVal = parseInt(maxpeople, 10);
                                        if (isNaN(minVal) || minVal < min_people)
                                            minVal = min_people;
                                        if (minVal > max_people) minVal = max_people;
                                        if (isNaN(maxVal) || maxVal < minVal) maxVal = minVal;
                                        setminpeople(minVal);
                                        setmaxpeople(maxVal);
                                    }}
                                />
                                <FieldLabel> - </FieldLabel>
                                <Input
                                    className="flex-1 text-center py-2 xl:py-3 text-md"
                                    type="number"
                                    value={maxpeople}
                                    min={min_people}
                                    max={max_people}
                                    onChange={(e) => setmaxpeople(Number(e.target.value))}
                                    onBlur={(e) => {
                                        let minVal = parseInt(minpeople, 10);
                                        let maxVal = parseInt(maxpeople, 10);
                                        if (isNaN(maxVal) || maxVal > max_people)
                                            maxVal = max_people;
                                        if (maxVal < min_people) maxVal = min_people;
                                        if (isNaN(minVal) || minVal > maxVal) minVal = maxVal;
                                        setminpeople(minVal);
                                        setmaxpeople(maxVal);
                                    }}
                                />
                                <FieldLabel>people</FieldLabel>
                            </div>
                        </div>



                        {/* TRANSPORTATION */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-md flex items-center gap-1">
                                {getTransportationIcon(transportation)} Transportation:
                            </FieldLabel>
                            <Select value={transportation} onValueChange={setTransportation}>
                                <SelectTrigger className="flex-1 py-2 xl:py-3 text-md">
                                    <SelectValue placeholder="Select transportation"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="walk">Walking</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>



                        {/* MEETING PLACE */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-md flex items-center gap-1">
                                <Pin className="w-5 h-5"/> Meeting place:
                            </FieldLabel>
                            <Select value={meeting} onValueChange={setMeeting}>
                                <SelectTrigger className="flex-1 py-2 xl:py-3 text-md">
                                    <SelectValue placeholder="Select location"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mine">My Place</SelectItem>
                                    <SelectItem value="yours">Your Place</SelectItem>
                                    <SelectItem value="first">First Stop</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>



                        {/* PRICE */}
                        <div className="flex justify-between gap-3 items-center">
                            <FieldLabel className="text-md flex items-center gap-1">
                                <CircleDollarSignIcon className="w-5 h-5"/> Price:
                            </FieldLabel>
                            <VNDInput
                                className="flex-1 text-[#23C491] text-lg xl:text-xl font-semibold"
                                value={price}
                                max={1e7}
                                onChange={setprice}
                            />
                            <FieldLabel className="text-md">
                                (per person)
                            </FieldLabel>
                        </div>



                        {/* PHOTOS */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-md flex items-center gap-1">
                                <PictureInPicture2Icon className="w-5 h-5"/> Photos:
                            </FieldLabel>
                            {/* ✅ STEP 4: Point to the new handler */}
                            <ImageUploader
                                images={imageData.images}
                                allowThumbnail={true}
                                thumbnailIdx={imageData.thumbnailIdx}
                                onImagesChange={handleImageChange}
                            />
                        </div>



                        {/* DESCRIPTION */}
                        <div className="flex flex-col w-full gap-2 relative">
                            <FieldLabel className="text-md flex items-center gap-1">
                                <Edit2 className="w-5 h-5"/> Description:
                            </FieldLabel>
                            <Textarea
                                value={description}
                                onChange={(e) =>
                                    setdescription(
                                        e.target.value.length > 1000
                                            ? description
                                            : e.target.value
                                    )
                                }
                                rows={5}
                                className="resize-none py-2 xl:py-3 text-md"
                            />
                            <span className="absolute bottom-1 right-2 text-xs xl:text-sm text-gray-400 select-none">
                                {description.length}/1000
                            </span>
                        </div>



                        {/* TAGS */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-md flex items-center gap-1">
                                <Tag className="w-5 h-5"/> Tags:
                            </FieldLabel>
                            <TagSelector
                                tags={TagList}
                                selectedTags={selectedTags}
                                setSelectedTags={setSelectedTags}
                                // tagVariants={TOUR_TAG_VARIANTS}
                                tagVariants={TOUR_TAG_STYLES}
                            />
                        </div>
                    </CardContent>



                    <CardFooter className="flex justify-end gap-4">
                        <Link to={`/tour/post/${tour_id}`}
                            className="
                bg-[#CC3737] text-white px-4 py-1
                rounded-full font-semibold text-base xl:text-lg
                hover:bg-white hover:border-1 hover:border-black hover:text-black
              "

                        >
                            Cancel
                        </Link>
                        <button
                            className="
                bg-[#068F64] text-white px-4 py-1
                rounded-full font-semibold text-base xl:text-lg
                hover:bg-white hover:border-1 hover:border-black hover:text-black
              "
                            onClick={handleSubmit}
                        >
                            Update Tour
                        </button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}