import Map from "../components/Map.jsx";
import {useState} from "react";
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
import {IdCard, CarTaxiFront, Clock, UserPlus, Tag, Coins, PictureInPicture2Icon} from "lucide-react"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import TagSelector from "@/components/tagsselector.jsx";
import VNDInput from "@/components/priceinput.jsx";

import ImageUploader from "@/components/imageuploader.jsx";
import DragList from "@/components/drag_list.jsx";


export default function TourCreate() {
    //People
    const min_people = 1;
    const max_people = 15;
    const [people, setpeople] = useState("");

    //Hour
    const min_hour = 1;
    const max_hour = 24;
    const [hour, sethour] = useState("");
    //Images
    const [images, setImages] = useState([]);
    const [thumbnailIdx, setThumbnailIdx] = useState(0);
    //Tags
    const TagList = ["Nature", "History", "Festivals", "Nightlife", "Shopping", "Sightseeing", "Adventure", "Trekking", "Beach", "Food Tour", "Motorbike Trip"];

    //Price
    const [price, setprice] = useState("");

    //Add Stops
    const [addedStops, setAddedStops] = useState([]);

    const handleAddStop = (newStop) => {
        setAddedStops((prevStops) => {
            const isDuplicate = prevStops.some((stop) => stop.name === newStop.name && stop.lat === newStop.lat && stop.lon === newStop.lon);
            if (isDuplicate) return prevStops;
            return [...prevStops, newStop];
        });
    };
    const handleRemoveStop = (index) => {
        setAddedStops((prev) => prev.filter((_, i) => i !== index));
    };

    return (<div className="flex flex-col-reverse md:flex-row gap-4 justify-center items-start">
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
                        <FieldLabel className="text-base">
                            Tour Schedule
                        </FieldLabel>
                        <DragList
                            items={addedStops}
                            onRemoveItem={handleRemoveStop}
                            onReorder={setAddedStops}
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
                        <Input className="flex-1" placeholder="My tour"></Input>
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
                                onChange={(e) => sethour(e.target.value)}
                            />
                            <FieldLabel>hour(s)</FieldLabel>
                        </div>
                    </div>
                    <FieldSeparator/>
                    {/*row 3*/}
                    <div className="flex justify-between gap-5">
                        <FieldLabel className="text-base">
                            <UserPlus></UserPlus>
                            Party size:
                        </FieldLabel>
                        <div className="flex justify-end gap-5 ">
                            <FieldLabel>Up to </FieldLabel>
                            <Input
                                className="flex-1 text-center"
                                type="number"
                                value={people}
                                min={min_people}
                                max={max_people}
                                onChange={(e) => setpeople(e.target.value)}
                            />
                            <FieldLabel>people</FieldLabel>
                        </div>
                    </div>
                    <FieldSeparator/>
                    {/*row 4*/}
                    <div className="flex justify-between gap-5">
                        <FieldLabel className="text-base">
                            <CarTaxiFront></CarTaxiFront>
                            Transportation:
                        </FieldLabel>
                        <Select>
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
                    {/*row 5*/}
                    <div className="flex justify-between gap-2">
                        <FieldLabel className="text-base">
                            <Coins></Coins>
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
                            Images:
                        </FieldLabel>
                        <ImageUploader
                            images={images}
                            onImagesChange={(imgs, thumbIdx) => {
                                setImages(imgs);
                                setThumbnailIdx(thumbIdx);
                            }}
                        />
                    </div>
                    <FieldSeparator/>
                    {/*row 7*/}
                    <div className="flex justify-between gap-5">
                        <FieldLabel>
                            <Tag></Tag>
                            Tags:
                        </FieldLabel>
                        <TagSelector tags={TagList}></TagSelector>
                    </div>
                </CardContent>

            </Card>

        </div>

    )
}