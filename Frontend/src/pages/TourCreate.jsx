import Map from "../components/Map.jsx";
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

export default function TourCreate() {
    //Tour name
    const [tourname, settourname] = useState("");
    //People
    const min_people = 1;
    const max_people = 15;
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
    const TagList = ["Nature", "History", "Festivals", "Nightlife", "Shopping", "Sightseeing", "Adventure", "Trekking", "Beach", "Food Tour", "Motorbike Trip"];

    //Price
    const [price, setprice] = useState("");
    //Description
    const [description, setdescription] = useState("");
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
        try {
            const formData = new FormData();

            if (!tourname || !hour || !minpeople || !maxpeople || !transportation || !price || !meeting || !addedStops?.length || !imageData) {
                toast.error("Please fill in all information!");
                return;
            }

            formData.append("name", tourname);
            formData.append("duration", hour || 0);
            formData.append("min_people", minpeople || 1);
            formData.append("max_people", maxpeople || 1);
            formData.append("transportation", transportation);
            formData.append("meeting_location", meeting);
            formData.append("price", price || 0);
            formData.append("places", JSON.stringify(addedStops || []));
            formData.append("tags", JSON.stringify(selectedTags || []));
            formData.append("description", description || "No description");
            imageData.images.forEach((img) => {
                if (img?.file) formData.append("images", img.file);
            });
            formData.append("thumbnail_idx", imageData.thumbnailIdx ?? 0);

            // Get JWT token from localStorage
            //const token = localStorage.getItem("access");

            const res = await fetch("http://127.0.0.1:8000/api/create_tour/", {
                method: "POST",
                // headers: {
                //     Authorization: `Bearer ${token}`, // ✅ add auth header
                // },
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Tour created successfully!");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                console.error("Server response:", data);
                toast.error("Failed to create tour", {
                    description: data.detail || data.error || "Unknown error",
                });
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            toast.error("Unable to connect to the server.", {
                description: "Check your Django logs.",
            });
        }
    };


    return (
        <div className="flex flex-col-reverse gap-4 md:flex-row justify-center items-start">
            <Card className="max-w-xl w-full md:w-xl">
                <CardHeader>
                    <CardTitle>
                        <h1 className="text-center text-xl font-bold">ADD TOUR PLACES HERE</h1>
                    </CardTitle>
                </CardHeader>
                <FieldSeparator/>
                <CardContent className="flex flex-col gap-4">
                    <div>
                        <Map onLocationAdd={handleAddStop}
                             className="w-full h-60 md:h-80"
                             addedStops={addedStops}
                        />
                    </div>
                    <FieldSeparator/>
                    <div className="space-y-2 w-full">
                        <div className="rounded-2xl border-[#5A74F8] border-2 p-3">
                            <FieldLabel className="text-base text-[#5A74F8] font-bold">
                                Tour Schedule
                            </FieldLabel>
                        </div>

                        <DragList
                            items={addedStops}
                            onRemoveItem={handleRemoveStop}
                            onReorder={setAddedStops}
                            onRenameItem={handleRenameStop}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="max-w-md w-full md:w-auto">
                <CardHeader>
                    <CardTitle>
                        <h1 className="text-center text-xl font-bold">CREATE YOUR TOUR POST</h1>
                    </CardTitle>
                </CardHeader>
                <FieldSeparator/>
                <CardContent className="flex flex-col gap-4">
                    {/*row 1*/}
                    <div className="flex justify-between gap-5">
                        <FieldLabel className="text-base">
                            <IdCard>
                            </IdCard>
                            Tour name:
                        </FieldLabel>
                        <Input
                            className="flex-1"
                            placeholder="My tour"
                            value={tourname}
                            onChange={(e) => settourname(e.target.value)}
                        />
                    </div>
                    <FieldSeparator/>
                    {/*row 2*/}
                    <div className="flex justify-between gap-5">
                        <FieldLabel className="text-base">
                            <Clock></Clock>
                            Duration:
                        </FieldLabel>
                        <div className="flex justify-end gap-5">
                            <FieldLabel>Up to </FieldLabel>
                            <Input
                                className="flex-1 text-center"
                                type="number"
                                value={hour}
                                min={min_hour}
                                max={max_hour}
                                // 1. Update the state normally as the user types
                                onChange={(e) => sethour(e.target.value)}

                                // 2. When the user clicks away, validate and clamp the value
                                onBlur={(e) => {
                                    let value = parseInt(e.target.value, 10);

                                    // If it's not a number, set it to the minimum
                                    if (isNaN(value)) {
                                        value = min_hour;
                                    }

                                    // Clamp the value between min and max
                                    if (value > max_hour) {
                                        value = max_hour;
                                    } else if (value < min_hour) {
                                        value = min_hour;
                                    }

                                    // Set the clamped value
                                    sethour(value);
                                }}
                            />
                            <FieldLabel>hour(s)</FieldLabel>
                        </div>
                    </div>
                    <FieldSeparator/>
                    {/*row 3*/}
                    <div className="flex justify-between gap-5">
                        <FieldLabel className="text-base">
                            <UserPlus/>
                            Group size:
                        </FieldLabel>
                        <div className="flex justify-end gap-3">
                            <Input
                                className="flex-1 text-center"
                                type="number"
                                value={minpeople}
                                min={min_people}
                                max={max_people}
                                // 1. onChange just updates the raw string value
                                onChange={(e) => {
                                    setminpeople(e.target.value);
                                }}
                                // 2. onBlur does all parsing, clamping, and adjusting
                                onBlur={(e) => {
                                    // Get the current values from state, parsing them
                                    let minVal = parseInt(minpeople, 10);
                                    let maxVal = parseInt(maxpeople, 10);

                                    // A. Validate and clamp minVal (the one that just blurred)
                                    if (isNaN(minVal) || minVal < min_people) {
                                        minVal = min_people;
                                    } else if (minVal > max_people) {
                                        minVal = max_people;
                                    }

                                    // B. Validate maxVal (the *other* input)
                                    // If maxVal is invalid OR is now less than our new minVal, adjust it
                                    if (isNaN(maxVal) || maxVal < minVal) {
                                        maxVal = minVal;
                                    }

                                    // C. Set both corrected states
                                    setminpeople(minVal);
                                    setmaxpeople(maxVal);
                                }}
                            />
                            <FieldLabel> - </FieldLabel>
                            <Input
                                className="flex-1 text-center"
                                type="number"
                                value={maxpeople}
                                min={min_people} // Use absolute min here
                                max={max_people}
                                // 1. onChange just updates the raw string value
                                onChange={(e) => {
                                    setmaxpeople(e.target.value);
                                }}
                                // 2. onBlur does all parsing, clamping, and adjusting
                                onBlur={(e) => {
                                    // Get the current values from state, parsing them
                                    let minVal = parseInt(minpeople, 10);
                                    let maxVal = parseInt(maxpeople, 10);

                                    // A. Validate and clamp maxVal (the one that just blurred)
                                    if (isNaN(maxVal) || maxVal > max_people) {
                                        maxVal = max_people;
                                    } else if (maxVal < min_people) {
                                        maxVal = min_people;
                                    }

                                    // B. Validate minVal (the *other* input)
                                    // If minVal is invalid OR is now greater than our new maxVal, adjust it
                                    if (isNaN(minVal) || minVal > maxVal) {
                                        minVal = maxVal;
                                    }

                                    // C. Set both corrected states
                                    setminpeople(minVal);
                                    setmaxpeople(maxVal);
                                }}
                            />
                            <FieldLabel>people</FieldLabel>
                        </div>
                    </div>
                    <FieldSeparator/>
                    {/*row 4.1*/}
                    <div className="flex justify-between gap-5">
                        <FieldLabel className="text-base">
                            {getTransportationIcon(transportation)}
                            Transportation:
                        </FieldLabel>
                        <Select value={transportation} onValueChange={setTransportation}>
                            <SelectTrigger className="flex-1">
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
                    {/*row 4.2*/}
                    <div className="flex justify-between gap-5">
                        <FieldLabel className="text-base">
                            <Pin/>
                            Meeting place:
                        </FieldLabel>
                        <Select value={meeting} onValueChange={setMeeting}>
                            <SelectTrigger className="flex-1">
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
                    {/*row 5*/}
                    <div className="flex justify-between gap-2">
                        <FieldLabel className="text-base">
                            <CircleDollarSignIcon/>
                            Price:
                        </FieldLabel>
                        <VNDInput
                            className="flex-1 text-green-400 text-xl sm: text-xl md:text-xl lg:text-xl xl:text-2xl"
                            value={price}
                            max={1e7}
                            onChange={setprice}
                        > </VNDInput>
                        <FieldLabel>(per person)</FieldLabel>
                    </div>
                    <FieldSeparator/>
                    {/*row 6*/}
                    <div className="flex justify-between gap-5">
                        <FieldLabel className="text-base">
                            <PictureInPicture2Icon/>
                            Photos:
                        </FieldLabel>
                        <ImageUploader
                            images={imageData.images}
                            onImagesChange={(imgs, thumbIdx) => setImageData({
                                images: imgs,
                                thumbnailIdx: thumbIdx
                            })}
                        />
                    </div>
                    <FieldSeparator/>
                    {/*row 6.1*/}
                    <div className="flex flex-col w-full gap-2 relative">
                        <FieldLabel className="text-base">
                            <Edit2/>
                            Description:
                        </FieldLabel>
                        <Textarea
                            placeholder="Enter a short description of your tour"
                            value={description}
                            onChange={(e) => setdescription(e.target.value.length > 150 ? description : e.target.value)}
                            rows={5} // controls initial height
                            className="resize-none"
                        />
                        <span className="absolute bottom-1 right-2 text-xs text-gray-400 select-none">
                            {description.length}/{150}
                        </span>
                    </div>
                    <FieldSeparator/>
                    {/*row 7*/}
                    <div className="flex justify-between gap-5">
                        <FieldLabel>
                            <Tag></Tag>
                            Tags:
                        </FieldLabel>
                        <TagSelector
                            tags={TagList}
                            selectedTags={selectedTags}
                            setSelectedTags={setSelectedTags}
                        />
                    </div>
                </CardContent>
                <FieldSeparator/>
                <CardFooter className="flex justify-end">
                    <button
                        className="bg-[#5A74F8] text-white px-4 py-2 rounded-xl hover:bg-[#6F86F9] hover:text-black"
                        onClick={handleSubmit}
                    >
                        Create Tour
                    </button>
                </CardFooter>

            </Card>

        </div>

    )
}