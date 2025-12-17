import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tripPlannerService } from "@/services/tripPlannerService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    MapPin,
    Calendar,
    DollarSign,
    Trash2,
    Eye,
    Loader2,
    FolderOpen,
    Clock,
} from "lucide-react";

export default function SavedTripPlans() {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    // Fetch saved plans
    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setIsLoading(true);
        const result = await tripPlannerService.getMyTripPlans();
        if (result.success) {
            setPlans(result.data);
        }
        setIsLoading(false);
    };

    // Handle delete
    const handleDelete = async (planId) => {
        setDeletingId(planId);
        const result = await tripPlannerService.deleteTripPlan(planId);
        if (result.success) {
            setPlans(plans.filter((p) => p.id !== planId));
        }
        setDeletingId(null);
    };

    // Format currency to USD (VND / 25000)
    const formatUSD = (value) => {
        return "$" + new Intl.NumberFormat("en-US").format(Math.round(value / 25000));
    };

    // Format date
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                <p className="mt-4 text-gray-500">Loading your trip plans...</p>
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <Card className="max-w-lg mx-auto">
                <CardContent className="py-16 text-center">
                    <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No saved trip plans yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                        Create your first trip plan and save it to see it here!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
                <Card
                    key={plan.id}
                    className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md bg-gradient-to-br from-white to-gray-50"
                >
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-bold text-gray-800 line-clamp-1">
                            {plan.name || `Trip to ${plan.province}`}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                            <MapPin className="w-4 h-4" />
                            {plan.province}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 py-4 px-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Days</p>
                                <p className="font-bold text-xl text-emerald-700">
                                    {plan.num_days}
                                </p>
                            </div>
                            <div className="text-center border-x border-emerald-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Budget</p>
                                <p className="font-bold text-lg text-emerald-700">
                                    {formatUSD(plan.budget)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">People</p>
                                <p className="font-bold text-xl text-emerald-700">
                                    {plan.num_people}
                                </p>
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full">
                                <Clock className="w-3.5 h-3.5" />
                                {plan.total_duration_hours}h total
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(plan.created_at)}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-5">
                            <Button
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all"
                                onClick={() =>
                                    navigate(`/trip-planner/${plan.id}`)
                                }
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                View Plan
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        {deletingId === plan.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            Delete Trip Plan?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete "
                                            {plan.name || `Trip to ${plan.province}`}
                                            ". This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-red-600 hover:bg-red-700"
                                            onClick={() => handleDelete(plan.id)}
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

