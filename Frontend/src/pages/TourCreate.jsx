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

// API
import { API_ENDPOINTS } from "@/constant";

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

            const res = await fetch(API_ENDPOINTS.CREATE_TOUR, {
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
        <div className="items-center">
    <Header/>
  <div
    className="
      flex flex-col-reverse gap-6 md:flex-row justify-center items-start
      mt-40 mb-40
      scale-100
      xl:scale-[1.1]
      2xl:scale-[1.0]
      3xl:scale-[1.4]
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
      <FieldSeparator />
      <CardContent className="flex flex-col gap-6 xl:gap-8">
        <div>
          <Map
            onLocationAdd={handleAddStop}
            className="w-full h-60 md:h-90 xl:h-110"
            addedStops={addedStops}
          />
        </div>
        <FieldSeparator />
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
      <FieldSeparator />
      <CardContent className="flex flex-col gap-6 xl:gap-8 text-base xl:text-lg">
        {/* ROW 1: TOUR NAME */}
        <div className="flex justify-between gap-5">
          <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
            <IdCard /> Tour name:
          </FieldLabel>
          <Input
            className="flex-1 py-2 xl:py-3 text-base xl:text-lg"
            placeholder="My tour"
            value={tourname}
            onChange={(e) => settourname(e.target.value)}
          />
        </div>

        <FieldSeparator />

        {/* ROW 2: DURATION */}
        <div className="flex justify-between gap-5">
          <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
            <Clock /> Duration:
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

        <FieldSeparator />

        {/* ROW 3: GROUP SIZE */}
        <div className="flex justify-between gap-5">
          <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
            <UserPlus /> Group size:
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

        <FieldSeparator />

        {/* TRANSPORTATION */}
        <div className="flex justify-between gap-5">
          <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
            {getTransportationIcon(transportation)} Transportation:
          </FieldLabel>
          <Select value={transportation} onValueChange={setTransportation}>
            <SelectTrigger className="flex-1 py-2 xl:py-3 text-base xl:text-lg">
              <SelectValue placeholder="Select transportation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private Transportation</SelectItem>
              <SelectItem value="public">Public Transportation</SelectItem>
              <SelectItem value="walk">Walking</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <FieldSeparator />

        {/* MEETING PLACE */}
        <div className="flex justify-between gap-5">
          <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
            <Pin /> Meeting place:
          </FieldLabel>
          <Select value={meeting} onValueChange={setMeeting}>
            <SelectTrigger className="flex-1 py-2 xl:py-3 text-base xl:text-lg">
              <SelectValue placeholder="Select meeting location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">My Place</SelectItem>
              <SelectItem value="yours">Your Place</SelectItem>
              <SelectItem value="first">First Stop</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <FieldSeparator />

        {/* PRICE */}
        <div className="flex justify-between gap-3 items-center">
          <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
            <CircleDollarSignIcon /> Price:
          </FieldLabel>
          <VNDInput
            className="flex-1 text-[#23C491] text-xl xl:text-2xl font-semibold"
            value={price}
            max={1e7}
            onChange={setprice}
          />
          <FieldLabel className="text-sm xl:text-base">(per person)</FieldLabel>
        </div>

        <FieldSeparator />

        {/* PHOTOS */}
        <div className="flex justify-between gap-5">
          <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
            <PictureInPicture2Icon /> Photos:
          </FieldLabel>
          <ImageUploader
            images={imageData.images}
            onImagesChange={(imgs, thumbIdx) =>
              setImageData({ images: imgs, thumbnailIdx: thumbIdx })
            }
          />
        </div>

        <FieldSeparator />

        {/* DESCRIPTION */}
        <div className="flex flex-col w-full gap-2 relative">
          <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
            <Edit2 /> Description:
          </FieldLabel>
          <Textarea
            placeholder="Enter a short description of your tour"
            value={
              description.length > 500
                ? description
                : description
            }
            onChange={(e) =>
              setdescription(e.target.value.length > 500 ? description : e.target.value)
            }
            rows={5}
            className="resize-none py-2 xl:py-3 text-base xl:text-lg"
          />
          <span className="absolute bottom-1 right-2 text-xs xl:text-sm text-gray-400 select-none">
            {description.length}/500
          </span>
        </div>

        <FieldSeparator />

        {/* TAGS */}
        <div className="flex justify-between gap-5">
          <FieldLabel className="text-base xl:text-lg flex items-center gap-1">
            <Tag /> Tags:
          </FieldLabel>
          <TagSelector
            tags={TagList}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />
        </div>
      </CardContent>

      <FieldSeparator />

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
  <Footer/>
</div>


    )
}