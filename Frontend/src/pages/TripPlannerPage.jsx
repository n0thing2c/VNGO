import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { tripPlannerService } from "@/services/tripPlannerService";
import { toast } from "sonner";

// Components
import TripPlannerForm from "@/components/trip-planner/TripPlannerForm";
import TripPlanResults from "@/components/trip-planner/TripPlanResults";
import HotelSuggestions from "@/components/trip-planner/HotelSuggestions";
import TripPlannerHero from "@/components/trip-planner/TripPlannerHero";
import SavedTripPlans from "@/components/trip-planner/SavedTripPlans";

// UI
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Icons
import { Sparkles, Save, Share2, Loader2, History, ArrowLeft } from "lucide-react";

export default function TripPlannerPage() {
    const navigate = useNavigate();
    const { planId } = useParams();
    const user = useAuthStore((state) => state.user);

    // State
    const [tripPlan, setTripPlan] = useState(null);
    const [savedPlanData, setSavedPlanData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("planner");
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [planName, setPlanName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isViewingPlan, setIsViewingPlan] = useState(false);

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            toast.error("Please log in to use the Trip Planner");
            navigate("/login");
        }
    }, [user, navigate]);

    // Load saved plan if planId is provided
    useEffect(() => {
        const loadSavedPlan = async () => {
            if (planId && user) {
                setIsLoading(true);
                setIsViewingPlan(true);
                const result = await tripPlannerService.getTripPlan(planId);
                
                if (result.success) {
                    setSavedPlanData(result.data);
                    // Transform saved plan data to match tripPlan format
                    const transformedPlan = transformSavedPlanToTripPlan(result.data);
                    setTripPlan(transformedPlan);
                } else {
                    toast.error("Failed to load trip plan");
                    navigate("/trip-planner");
                }
                setIsLoading(false);
            }
        };

        loadSavedPlan();
    }, [planId, user, navigate]);

    // Transform saved plan data to the format expected by TripPlanResults
    const transformSavedPlanToTripPlan = (savedPlan) => {
        const savedDays = savedPlan.days || [];
        
        // Transform days - backend already provides 'tours' array via serializer
        const days = savedDays.map(day => {
            const tours = day.tours || [];
            const totalDuration = tours.reduce((sum, tour) => sum + (tour.duration || 0), 0);
            
            return {
                day_number: day.day_number,
                date: day.date,
                notes: day.notes,
                total_duration: totalDuration,
                tours: tours.map(tour => ({
                    id: tour.id,
                    name: tour.name,
                    thumbnail: tour.thumbnail,
                    price: tour.price,
                    duration: tour.duration,
                    transportation: tour.transportation,
                    rating: tour.rating,
                    rating_count: tour.rating_count,
                    tags: tour.tags || [],
                    places: tour.places || [],
                    guide_name: tour.guide_name,
                    start_time: tour.suggested_start_time,
                    recommendation_score: tour.recommendation_score,
                    recommendation_reasons: tour.recommendation_reason ? [tour.recommendation_reason] : [],
                })),
            };
        });

        // Calculate totals
        const totalCost = savedDays.reduce((sum, day) => {
            return sum + (day.tours || []).reduce((daySum, tour) => {
                return daySum + (tour.price || 0);
            }, 0);
        }, 0);

        return {
            province: savedPlan.province,
            num_days: savedPlan.num_days,
            budget: savedPlan.budget,
            num_people: savedPlan.num_people,
            total_cost: savedPlan.total_estimated_cost || totalCost,
            budget_remaining: savedPlan.budget - (savedPlan.total_estimated_cost || totalCost),
            total_duration: savedPlan.total_duration_hours,
            tours_included: savedDays.reduce((sum, day) => sum + (day.tours?.length || 0), 0),
            days,
            hotels: (savedPlan.hotel_suggestions || []).map(hotel => ({
                id: hotel.id,
                external_id: hotel.external_id,
                name: hotel.name,
                address: hotel.address,
                price_per_night: hotel.price_per_night,
                rating: hotel.rating,
                review_count: hotel.review_count,
                thumbnail_url: hotel.thumbnail_url,
                booking_url: hotel.booking_url,
                distance_to_center: hotel.distance_to_center,
                match_score: hotel.match_score,
            })),
        };
    };

    // Handle form submission
    const handleGeneratePlan = async (formData) => {
        setIsLoading(true);
        setTripPlan(null);

        const result = await tripPlannerService.generateTripPlan(formData);

        if (result.success) {
            setTripPlan(result.data);
            toast.success("Trip plan generated!", {
                description: `Found ${result.data.tours_included} tours for your ${result.data.num_days}-day trip`,
            });
        }

        setIsLoading(false);
    };

    // Handle save
    const handleSave = async () => {
        if (!tripPlan) return;

        setIsSaving(true);
        const result = await tripPlannerService.saveTripPlan(
            planName || `Trip to ${tripPlan.province}`,
            tripPlan
        );

        if (result.success) {
            setShowSaveDialog(false);
            setPlanName("");
        }

        setIsSaving(false);
    };

    // Handle share
    const handleShare = async () => {
        // For now, just copy plan summary to clipboard
        if (!tripPlan) return;

        const summary = `🗺️ ${tripPlan.num_days}-Day Trip to ${tripPlan.province}\n` +
            `💰 Budget: $${Math.round(tripPlan.budget / 25000).toLocaleString()}\n` +
            `🎯 Tours: ${tripPlan.tours_included}\n` +
            `⏱️ Total Duration: ${tripPlan.total_duration} hours`;

        try {
            await navigator.clipboard.writeText(summary);
            toast.success("Trip summary copied to clipboard!");
        } catch (err) {
            toast.error("Failed to copy");
        }
    };

    if (!user) {
        return null;
    }

    // If viewing a saved plan, show different layout
    if (isViewingPlan && planId) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50">
                {/* Hero Section */}
                <TripPlannerHero />

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 py-8 -mt-16 relative z-10">
                    {/* Back button + Title */}
                    <div className="mb-8 space-y-4">
                        {/* Back button pinned to top-left of main content */}
                        <button
                            onClick={() => navigate("/trip-planner")}
                            className="group inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                        >
                            <ArrowLeft className="w-5 h-5 text-emerald-600 group-hover:-translate-x-1 transition-transform duration-300" />
                            <span className="font-medium text-gray-700 group-hover:text-emerald-700">
                                Back to Trip Planner
                            </span>
                        </button>

                        {savedPlanData && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            {savedPlanData.name || `Trip to ${savedPlanData.province}`}
                                        </h1>
                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                            <span>📍 {savedPlanData.province}</span>
                                            <span>📅 {savedPlanData.num_days} days</span>
                                            <span>👥 {savedPlanData.num_people} people</span>
                                            <span>💰 ${Math.round((savedPlanData.budget || 0) / 25000).toLocaleString()} budget</span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            onClick={handleShare}
                                            className="h-fit"
                                        >
                                            <Share2 className="w-4 h-4 mr-2" />
                                            Share
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                            <p className="mt-4 text-lg font-medium text-gray-700">
                                Loading your trip plan...
                            </p>
                        </div>
                    )}

                    {/* Results */}
                    {tripPlan && !isLoading && (
                        <div className="space-y-6">
                            {/* Results Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Trip Timeline - Takes 2 columns */}
                                <div className="lg:col-span-2">
                                    <TripPlanResults tripPlan={tripPlan} />
                                </div>

                                {/* Hotel Suggestions - 1 column */}
                                <div className="lg:col-span-1">
                                    <HotelSuggestions hotels={tripPlan.hotels || []} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50">
            {/* Hero Section */}
            <TripPlannerHero />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 -mt-16 relative z-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Custom Tabs */}
                    <div className="flex justify-center mb-10">
                        <div className="inline-flex bg-white rounded-2xl p-1.5 shadow-lg border border-gray-100">
                            <button
                                onClick={() => setActiveTab("planner")}
                                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                                    activeTab === "planner"
                                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                                        : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
                                }`}
                            >
                                <Sparkles className={`w-5 h-5 ${activeTab === "planner" ? "animate-pulse" : ""}`} />
                                Create New Trip
                            </button>
                            <button
                                onClick={() => setActiveTab("saved")}
                                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                                    activeTab === "saved"
                                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                                        : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
                                }`}
                            >
                                <History className="w-5 h-5" />
                                My Saved Plans
                            </button>
                        </div>
                    </div>

                    {/* Hidden TabsList for functionality */}
                    <TabsList className="hidden">
                        <TabsTrigger value="planner">Plan</TabsTrigger>
                        <TabsTrigger value="saved">Saved</TabsTrigger>
                    </TabsList>

                    {/* Planner Tab */}
                    <TabsContent value="planner" className="space-y-6">
                        {/* Input Form */}
                        <TripPlannerForm
                            onSubmit={handleGeneratePlan}
                            isLoading={isLoading}
                        />

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="relative">
                                    <div className="w-20 h-20 border-4 border-emerald-200 rounded-full animate-pulse" />
                                    <Loader2 className="w-10 h-10 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
                                </div>
                                <p className="mt-4 text-lg font-medium text-gray-700">
                                    Crafting your perfect trip...
                                </p>
                                <p className="text-sm text-gray-500">
                                    Finding the best tours and hotels for you
                                </p>
                            </div>
                        )}

                        {/* Results */}
                        {tripPlan && !isLoading && (
                            <div className="space-y-6">
                                {/* Action Buttons */}
                                <div className="flex justify-center gap-4">
                                    <Button
                                        onClick={() => setShowSaveDialog(true)}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Plan
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleShare}
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share
                                    </Button>
                                </div>

                                {/* Results Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Trip Timeline - Takes 2 columns */}
                                    <div className="lg:col-span-2">
                                        <TripPlanResults tripPlan={tripPlan} />
                                    </div>

                                    {/* Hotel Suggestions - 1 column */}
                                    <div className="lg:col-span-1">
                                        <HotelSuggestions hotels={tripPlan.hotels || []} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Saved Plans Tab */}
                    <TabsContent value="saved">
                        <SavedTripPlans />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Save Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Trip Plan</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="planName">Plan Name</Label>
                        <Input
                            id="planName"
                            placeholder={`Trip to ${tripPlan?.province || "..."}`}
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowSaveDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Plan"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

