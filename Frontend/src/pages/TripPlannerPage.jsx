import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Sparkles, Save, Share2, Loader2, History } from "lucide-react";

export default function TripPlannerPage() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    // State
    const [tripPlan, setTripPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("planner");
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [planName, setPlanName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            toast.error("Please log in to use the Trip Planner");
            navigate("/login");
        }
    }, [user, navigate]);

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
            `💰 Budget: ${tripPlan.budget.toLocaleString()} VND\n` +
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-teal-50">
            {/* Hero Section */}
            <TripPlannerHero />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 -mt-16 relative z-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                        <TabsTrigger value="planner" className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Plan New Trip
                        </TabsTrigger>
                        <TabsTrigger value="saved" className="flex items-center gap-2">
                            <History className="w-4 h-4" />
                            My Plans
                        </TabsTrigger>
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

