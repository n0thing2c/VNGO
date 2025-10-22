import Map from "../components/Map.jsx";
import TextInput from "../components/TextInput.jsx";
import {useState} from "react";
import {Combobox} from "@/components/ui/combobox.jsx";
import NumberInput from "../components/NumberInput.jsx";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import {IdCard,CarTaxiFront,Clock,UserPlus,Tag,Coins} from "lucide-react"
import {IconDefault} from "leaflet/src/layer/marker/Icon.Default.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import TagSelector from "@/components/tagsselector.jsx";
import VNDInput from "@/components/priceinput.jsx";
export default function TourCreate()
{
    //People
    const min_people = 1;
    const max_people = 15;
    const [people,setpeople]=useState("");

    //Hour
    const min_hour = 1;
    const max_hour = 24;
    const [hour,sethour]=useState("");

    //Tags
    const TagList = ["Adventure", "Food", "Nature", "History", "Beach", "City"];

    //Price
    const [price,setprice]=useState("");
    return(
        <div className ="flex justify-center">
            <Card className="w-full max-w-fit max-h-fit">
                <CardHeader>
                    <CardTitle>
                        <h1 className="text-center text-xl font-bold">ADD TOUR PLACES HERE</h1>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-10 ">
                    <Map width = "700px" height="500px"></Map>
                </CardContent>
            </Card>

            <Card className="w-full max-w-fit max-h-fit">
                <CardHeader>
                    <CardTitle>
                        <h1 className="text-center text-xl font-bold">CREATE YOUR TOUR POST</h1>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/*row 1*/}
                    <div className="flex justify-between">
                        <FieldLabel className="text-base">
                            <IdCard>
                            </IdCard>
                            Tour name:
                        </FieldLabel>
                        <Input className="w-60" placeholder="My tour"></Input>
                    </div>
                    {/*row 2*/}
                    <div className="flex justify-between">
                        <FieldLabel className="text-base">
                            <Clock></Clock>
                             Duration:
                        </FieldLabel>
                        <div className="flex justify-center gap-5 w-60">
                            <FieldLabel>Up to </FieldLabel>
                            <Input
                            className="w-25 text-center"
                            type = "number"
                            value = {hour}
                            min = {min_hour}
                            max = {max_hour}
                            onChange ={(e)=>sethour(e.target.value)}
                            />
                            <FieldLabel>hour(s)</FieldLabel>
                        </div>
                    </div>
                    {/*row 3*/}
                    <div className="flex justify-between">
                        <FieldLabel className="text-base">
                            <UserPlus></UserPlus>
                            Party size:
                        </FieldLabel>
                        <div className="flex justify-center gap-5 w-60">
                            <FieldLabel>Up to </FieldLabel>
                            <Input
                            className="w-25 text-center"
                            type = "number"
                            value = {people}
                            min = {min_people}
                            max = {max_people}
                            onChange ={(e)=>setpeople(e.target.value)}
                            />
                            <FieldLabel>people</FieldLabel>
                        </div>
                    </div>
                    {/*row 4*/}
                    <div className="flex justify-between">
                        <FieldLabel className="text-base">
                            <CarTaxiFront></CarTaxiFront>
                            Transportation:
                        </FieldLabel>
                        <Select>
                            <SelectTrigger className="w-60">
                                <SelectValue placeholder="Select transportation"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">Private Transportation</SelectItem>
                                <SelectItem value="public">Public Transportation</SelectItem>
                                <SelectItem value="walk">Walking</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {/*row 5*/}
                    <div className="flex justify-between">
                        <FieldLabel>
                            <Coins></Coins>
                            Price
                        </FieldLabel>
                        <VNDInput
                            className="w-60"
                            value={price}
                            onChange={setprice}
                        > </VNDInput>


                    </div>
                    {/*row 6*/}
                    <div className="flex justify-between">
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