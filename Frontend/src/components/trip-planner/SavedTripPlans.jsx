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

    // Format currency
    const formatVND = (value) => {
        return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
                <Card
                    key={plan.id}
                    className="group hover:shadow-lg transition-shadow"
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-lg line-clamp-1">
                                    {plan.name || `Trip to ${plan.province}`}
                                </CardTitle>
                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {plan.province}
                                </div>
                            </div>
                            <Badge
                                variant={
                                    plan.status === "saved"
                                        ? "secondary"
                                        : plan.status === "completed"
                                        ? "default"
                                        : "outline"
                                }
                            >
                                {plan.status}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-dashed">
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Days</p>
                                <p className="font-bold text-gray-700">
                                    {plan.num_days}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Budget</p>
                                <p className="font-bold text-gray-700 text-sm">
                                    {formatVND(plan.budget)}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500">People</p>
                                <p className="font-bold text-gray-700">
                                    {plan.num_people}
                                </p>
                            </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {plan.total_duration_hours}h total
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(plan.created_at)}
                            </span>
                        </div>

                        {/* Tags */}
                        {plan.preferred_tags && plan.preferred_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                                {plan.preferred_tags.slice(0, 3).map((tag, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {typeof tag === "object" ? tag.tag : tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                            <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() =>
                                    navigate(`/trip-planner/${plan.id}`)
                                }
                            >
                                <Eye className="w-4 h-4 mr-1" />
                                View
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

