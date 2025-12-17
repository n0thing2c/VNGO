import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    MapPin,
    Calendar,
    Wallet,
    Users,
    Tag,
    Sparkles,
    Loader2,
    X,
} from "lucide-react";

// Popular Vietnam destinations
const POPULAR_PROVINCES = [
    "Ho Chi Minh City",
    "Hanoi",
    "Da Nang",
    "Hoi An",
    "Hue",
    "Nha Trang",
    "Da Lat",
    "Phu Quoc",
    "Ha Long",
    "Sa Pa",
    "Can Tho",
    "Vung Tau",
];

// Common tour tags
const AVAILABLE_TAGS = [
    "Food",
    "Culture",
    "Adventure",
    "Nature",
    "History",
    "Photography",
    "Relaxation",
    "Shopping",
    "Nightlife",
    "Family",
    "Romantic",
    "Budget",
];

export default function TripPlannerForm({ onSubmit, isLoading }) {
    // Form state
    const [province, setProvince] = useState("");
    const [numDays, setNumDays] = useState(3);
    const [budget, setBudget] = useState(200); // USD
    const [numPeople, setNumPeople] = useState(1);
    const [selectedTags, setSelectedTags] = useState([]);
    const [maxHoursPerDay, setMaxHoursPerDay] = useState(8);

    // Handle tag selection
    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter((t) => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    // USD to VND conversion rate
    const USD_TO_VND = 25000;

    // Handle submit
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!province) {
            return;
        }

        onSubmit({
            province,
            numDays,
            budget: budget * USD_TO_VND, // Convert USD to VND for backend
            numPeople,
            preferredTags: selectedTags,
            maxHoursPerDay,
        });
    };

    // Format currency to USD
    const formatUSD = (value) => {
        return "$" + new Intl.NumberFormat("en-US").format(value);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold text-gray-800">
                    Create Your Trip Plan
                </CardTitle>
                <p className="text-gray-500">
                    Fill in your preferences and let AI create the perfect itinerary
                </p>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Destination */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-base">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            Destination
                        </Label>
                        <Select value={province} onValueChange={setProvince}>
                            <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select a destination" />
                            </SelectTrigger>
                            <SelectContent>
                                {POPULAR_PROVINCES.map((prov) => (
                                    <SelectItem key={prov} value={prov}>
                                        {prov}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Duration & People - Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Number of Days */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-base">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                Duration (days)
                            </Label>
                            <div className="flex items-center gap-4">
                                <Slider
                                    value={[numDays]}
                                    onValueChange={([val]) => setNumDays(val)}
                                    min={1}
                                    max={14}
                                    step={1}
                                    className="flex-1"
                                />
                                <span className="w-12 text-center font-bold text-lg text-emerald-700">
                                    {numDays}
                                </span>
                            </div>
                        </div>

                        {/* Number of People */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-base">
                                <Users className="w-4 h-4 text-emerald-600" />
                                Travelers
                            </Label>
                            <div className="flex items-center gap-4">
                                <Slider
                                    value={[numPeople]}
                                    onValueChange={([val]) => setNumPeople(val)}
                                    min={1}
                                    max={20}
                                    step={1}
                                    className="flex-1"
                                />
                                <span className="w-12 text-center font-bold text-lg text-emerald-700">
                                    {numPeople}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="space-y-2">
                        <Label className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-base">
                                <Wallet className="w-4 h-4 text-emerald-600" />
                                Total Budget
                            </span>
                            <span className="text-emerald-700 font-bold">
                                {formatUSD(budget)}
                            </span>
                        </Label>
                        <Slider
                            value={[budget]}
                            onValueChange={([val]) => setBudget(val)}
                            min={50}
                            max={2000}
                            step={10}
                            className="py-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>$50</span>
                            <span>~{formatUSD(Math.round(budget / numDays))} / day</span>
                            <span>$2,000</span>
                        </div>
                    </div>

                    {/* Max Hours Per Day */}
                    <div className="space-y-2">
                        <Label className="flex items-center justify-between">
                            <span className="text-base">Max hours of tours per day</span>
                            <span className="text-emerald-700 font-bold">{maxHoursPerDay}h</span>
                        </Label>
                        <Slider
                            value={[maxHoursPerDay]}
                            onValueChange={([val]) => setMaxHoursPerDay(val)}
                            min={4}
                            max={12}
                            step={1}
                        />
                    </div>

                    {/* Preferred Tags */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base">
                            <Tag className="w-4 h-4 text-emerald-600" />
                            What are you interested in? (optional)
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                                    className={`cursor-pointer transition-all ${
                                        selectedTags.includes(tag)
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "hover:bg-emerald-50 hover:border-emerald-300"
                                    }`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                    {selectedTags.includes(tag) && (
                                        <X className="w-3 h-3 ml-1" />
                                    )}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={!province || isLoading}
                        className="w-full h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Creating your trip...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Generate Trip Plan
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

