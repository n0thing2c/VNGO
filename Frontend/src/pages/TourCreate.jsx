import Map from "../components/APIs/Map.jsx";
import {use, useState} from "react";
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
    Edit2
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
import Header from "@/components/layout/Header.jsx";
import Footer from "@/components/layout/Footer.jsx";
import HeroSection from "@/components/HomePage/HeroSection.jsx";
import {tourService} from "@/services/tourService.js";

export default function TourCreate() {
    //Tour name
    const [tourname, settourname] = useState("");
    //People
    const min_people = 1;
    const max_people = 10;
    const [minpeople, setminpeople] = useState("");
    const [maxpeople, setmaxpeople] = useState("");
    //Transportation
    const [transportation, setTransportation] = useState("");
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

    //Meeting place
    const [meeting, setMeeting] = useState("");
    //Hour
    const min_hour = 1;
    const max_hour = 24;
    const [hour, sethour] = useState("");
    //Images
    const [imageData, setImageData] = useState({images: [], thumbnailIdx: 0});
    //Tags
    const [selectedTags, setSelectedTags] = useState([]);
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

    //Price
    const [price, setprice] = useState("");
    //Description
    const [description, setdescription] = useState("");
    //Stops Descriptions
    const [stopsDescriptions, setStopsDescriptions] = useState([]);
    //Add Stops
    const [addedStops, setAddedStops] = useState([]);

    const handleAddStop = (newStop) => {
        setAddedStops((prevStops) => {
            const existingIndex = prevStops.findIndex(
                (stop) => stop.lat === newStop.lat && stop.lon === newStop.lon
            );

            if (existingIndex !== -1) {
                // Update existing stop (e.g., to add English name later)
                const updatedStops = [...prevStops];
                updatedStops[existingIndex] = {...prevStops[existingIndex], ...newStop};
                return updatedStops;
            }

            // Add new stop if not exists
            return [...prevStops, newStop];
        });
    };

    const handleRemoveStop = (index) => {
        setAddedStops((prev) => prev.filter((_, i) => i !== index));
    };
    const handleRenameStop = async (index, newName) => {
        const englishName = await generateEnglishName(newName.trim() || addedStops[index].name);
        setAddedStops((prevStops) =>
            prevStops.map((stop, i) =>
                i === index
                    ? {
                        ...stop,
                        name: newName.trim() !== "" ? newName.trim() : stop.name,
                        name_en: englishName,
                    }
                    : stop
            )
        );
    };

    const generateEnglishName = async (vietName) => {
        if (!vietName || vietName.trim() === "") return "";

        let englishName = vietName;

        try {
            const res = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(vietName)}`
            );
            const data = await res.json();
            // The translated text is in data[0][0][0]
            englishName = data[0][0][0];
        } catch (err) {
            console.error("Translation failed, using original name:", err);
        }


        return englishName
    };


    const handleSubmit = async () => {
        // Tách description ra thành mảng chuỗi để gửi xuống backend
        // Backend mong đợi: stops_descriptions = ["desc 1", "desc 2", ...]
        const stopsDescriptions = addedStops.map((stop) => stop.description);
        const result = await tourService.createTour({
            tourname,
            hour,
            minpeople,
            maxpeople,
            transportation,
            meeting,
            addedStops,
            imageData,
            selectedTags,
            price,
            description,
            addedStops,     // Gửi list địa điểm
            // Gửi thêm mảng mô tả đã tách
            stops_descriptions: JSON.stringify(stopsDescriptionsArray), 
            // Lưu ý: Nếu tourService của bạn tự stringify thì bỏ JSON.stringify ở đây đi
            // Căn cứ vào views.py bạn gửi, backend có đoạn json.loads(stops_descriptions), 
            // nên ở đây ta gửi JSON string hoặc array tùy theo cách tourService xử lý FormData.
            // An toàn nhất với FormData là gửi string JSON.
        });

        if (result.success) {
            setTimeout(() => window.location.reload(), 1500);
        }
    };
    
    return (
        <div className="items-center">
            <div
                className="
      flex flex-col-reverse gap-6 md:flex-row justify-center items-start
      mt-40 mb-40
      scale-100
      xl:scale-[0.7]
      2xl:scale-[0.8]
      3xl:scale-[0.9]
      transition-transform duration-300 origin-top
    "
            >
                {/* LEFT CARD (MAP + TOUR SCHEDULE) */}
                <Card className="w-full max-w-xl xl:max-w-2xl 2xl:max-w-3xl">
                    <CardHeader>
                        <CardTitle>
                            <h1 className="text-center text-xl xl:text-2xl 2xl:text-3xl font-bold p-5">
                                ADD TOUR PLACES HERE
                            </h1>
                        </CardTitle>
                    </CardHeader>
                    <FieldSeparator/>
                    <CardContent className="flex flex-col gap-6 xl:gap-8">
                        <div>
                            <Map
                                onLocationAdd={handleAddStop}
                                className="w-full h-60 md:h-90 xl:h-110"
                                addedStops={addedStops}
                            />
                        </div>
                        <FieldSeparator/>
                        <div className="space-y-4 w-full">
                            <div className="rounded-2xl border-[#23C491] border-2 p-4">
                                <FieldLabel className="text-base xl:text-lg text-[#23C491] font-bold">
                                    Tour Schedule
                                </FieldLabel>
                            </div>

                            <DragList
                                items={addedStops}
                                onRemoveItem={handleRemoveStop}
                                onReorder={setAddedStops}
                                onRenameItem={handleRenameStop}
                                onEditDescription={handleEditDescription}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* RIGHT CARD (TOUR CREATION) */}
                <Card className="w-full max-w-md xl:max-w-lg 2xl:max-w-xl">
                    <CardHeader>
                        <CardTitle>
                            <h1 className="text-center text-xl xl:text-2xl 2xl:text-3xl font-bold p-5">
                                CREATE YOUR TOUR POST
                            </h1>
                        </CardTitle>
                    </CardHeader>
                    <FieldSeparator/>
                    <CardContent className="flex flex-col gap-6 xl:gap-8 text-base xl:text-lg">
                        {/* ROW 1: TOUR NAME */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
                                <IdCard/> Tour name:
                            </FieldLabel>
                            <Input
                                className="flex-1 py-2 xl:py-3 text-base xl:text-lg"
                                placeholder="My tour"
                                value={tourname}
                                onChange={(e) => settourname(e.target.value)}
                            />
                        </div>

                        <FieldSeparator/>

                        {/* ROW 2: DURATION */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
                                <Clock/> Duration:
                            </FieldLabel>
                            <div className="flex justify-end gap-3 items-center">
                                <FieldLabel className="hidden md:inline">Up to</FieldLabel>
                                <Input
                                    className="flex-1 text-center py-2 xl:py-3 text-base xl:text-lg"
                                    type="number"
                                    value={hour}
                                    min={min_hour}
                                    max={max_hour}
                                    onChange={(e) => sethour(e.target.value)}
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

                        <FieldSeparator/>

                        {/* ROW 3: GROUP SIZE */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
                                <UserPlus/> Group size:
                            </FieldLabel>
                            <div className="flex justify-end gap-3 items-center">
                                <Input
                                    className="flex-1 text-center py-2 xl:py-3 text-base xl:text-lg"
                                    type="number"
                                    value={minpeople}
                                    min={min_people}
                                    max={max_people}
                                    onChange={(e) => setminpeople(e.target.value)}
                                    onBlur={(e) => {
                                        let minVal = parseInt(minpeople, 10);
                                        let maxVal = parseInt(maxpeople, 10);
                                        if (isNaN(minVal) || minVal < min_people) minVal = min_people;
                                        if (minVal > max_people) minVal = max_people;
                                        if (isNaN(maxVal) || maxVal < minVal) maxVal = minVal;
                                        setminpeople(minVal);
                                        setmaxpeople(maxVal);
                                    }}
                                />
                                <FieldLabel> - </FieldLabel>
                                <Input
                                    className="flex-1 text-center py-2 xl:py-3 text-base xl:text-lg"
                                    type="number"
                                    value={maxpeople}
                                    min={min_people}
                                    max={max_people}
                                    onChange={(e) => setmaxpeople(e.target.value)}
                                    onBlur={(e) => {
                                        let minVal = parseInt(minpeople, 10);
                                        let maxVal = parseInt(maxpeople, 10);
                                        if (isNaN(maxVal) || maxVal > max_people) maxVal = max_people;
                                        if (maxVal < min_people) maxVal = min_people;
                                        if (isNaN(minVal) || minVal > maxVal) minVal = maxVal;
                                        setminpeople(minVal);
                                        setmaxpeople(maxVal);
                                    }}
                                />
                                <FieldLabel>people</FieldLabel>
                            </div>
                        </div>

                        <FieldSeparator/>

                        {/* TRANSPORTATION */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
                                {getTransportationIcon(transportation)} Transportation:
                            </FieldLabel>
                            <Select value={transportation} onValueChange={setTransportation}>
                                <SelectTrigger className="flex-1 py-2 xl:py-3 text-base xl:text-lg">
                                    <SelectValue placeholder="Select transportation"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="private">Private Transportation</SelectItem>
                                    <SelectItem value="public">Public Transportation</SelectItem>
                                    <SelectItem value="walk">Walking</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <FieldSeparator/>

                        {/* MEETING PLACE */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
                                <Pin/> Meeting place:
                            </FieldLabel>
                            <Select value={meeting} onValueChange={setMeeting}>
                                <SelectTrigger className="flex-1 py-2 xl:py-3 text-base xl:text-lg">
                                    <SelectValue placeholder="Select meeting location"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mine">My Place</SelectItem>
                                    <SelectItem value="yours">Your Place</SelectItem>
                                    <SelectItem value="first">First Stop</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <FieldSeparator/>

                        {/* PRICE */}
                        <div className="flex justify-between gap-3 items-center">
                            <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
                                <CircleDollarSignIcon/> Price:
                            </FieldLabel>
                            <VNDInput
                                className="flex-1 text-[#23C491] text-xl xl:text-2xl font-semibold"
                                value={price}
                                max={5e6}
                                onChange={setprice}
                            />
                            <FieldLabel className="text-sm xl:text-base">(per person)</FieldLabel>
                        </div>

                        <FieldSeparator/>

                        {/* PHOTOS */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
                                <PictureInPicture2Icon/> Photos:
                            </FieldLabel>
                            <ImageUploader
                                images={imageData.images}
                                allowThumbnail={true}
                                onImagesChange={(imgs, thumbIdx) =>
                                    setImageData({images: imgs, thumbnailIdx: thumbIdx})
                                }
                            />
                        </div>

                        <FieldSeparator/>

                        {/* DESCRIPTION */}
                        <div className="flex flex-col w-full gap-2 relative">
                            <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
                                <Edit2/> Description:
                            </FieldLabel>
                            <Textarea
                                placeholder="Enter a short description of your tour"
                                value={
                                    description.length > 1000
                                        ? description
                                        : description
                                }
                                onChange={(e) =>
                                    setdescription(e.target.value.length > 1000 ? description : e.target.value)
                                }
                                rows={5}
                                className="resize-none py-2 xl:py-3 text-base xl:text-lg"
                            />
                            <span className="absolute bottom-1 right-2 text-xs xl:text-sm text-gray-400 select-none">
            {description.length}/1000
          </span>
                        </div>

                        <FieldSeparator/>

                        {/* TAGS */}
                        <div className="flex justify-between gap-5">
                            <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
                                <Tag/> Tags:
                            </FieldLabel>
                            <TagSelector
                                tags={TagList}
                                selectedTags={selectedTags}
                                setSelectedTags={setSelectedTags}
                                tagVariants={TOUR_TAG_VARIANTS}
                            />
                        </div>
                    </CardContent>

                    <FieldSeparator/>

                    <CardFooter className="flex justify-end">
                        <button
                            className="
            bg-[#23C491] text-white px-4 py-2
            rounded-2xl font-semibold text-base xl:text-lg
            hover:bg-white hover:border-1 hover:border-black hover:text-black
          "
                            onClick={handleSubmit}
                        >
                            Create Tour
                        </button>
                    </CardFooter>
                </Card>
            </div>
        </div>


    )
}