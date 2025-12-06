// dùng cho incoming request luôn
// src/components/management/BookingCard.jsx

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, DollarSign } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { managementService } from "@/services/managementService";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";

export default function BookingCard({ booking, showActions = false, refreshData }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const handleCardClick = (event) => {
    // Ignore clicks coming from interactive elements
    if (
      event.defaultPrevented ||
      event.target.closest("button, a, input, textarea, [role='button']")
    ) {
      return;
    }
    window.location.href = `/tour/${booking.tourId}`;
  };

  const handleTouristClick = async (event) => {
    event.stopPropagation();

    const detail = await managementService.getBookingDetails(booking.id);
    const touristId =
      detail?.data?.tourist?.id ??
      detail?.data?.tourist ??
      detail?.data?.tourist_id;

    if (!touristId) {
      toast.error("Can't find tourist ID.");
      return;
    }

    try {
      navigate(`/tourist-public-profile/${touristId}`);
    } catch (err) {
      window.location.href = `/tourist-public-profile/${touristId}`;
    }
  };

  const getStatusStyle = (status) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("accept")) {
      return "bg-green-100 text-green-800 shadow-lg";
    } else if (statusLower.includes("pending")) {
      return "bg-yellow-100 text-yellow-800 shadow-lg";
    } else if (statusLower.includes("decline")) {
      return "bg-red-100 text-red-800 shadow-lg";
    }
    return "bg-gray-100 text-gray-800 shadow-lg";
  };

  const handleAccept = async (event) => {
    event.stopPropagation();
    setIsProcessing(true);
    const result = await managementService.respondToBooking(
      booking.id,
      "accept"
    );

    if (result.success) {
      toast.success("Booking accepted successfully!");
      if (refreshData) {
        await refreshData();
      }
      navigate("/management");
    }

    setIsProcessing(false);
  };

  const handleDecline = async (event) => {
    event.stopPropagation();
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining.");
      return;
    }

    setIsProcessing(true);
    const result = await managementService.respondToBooking(
      booking.id,
      "decline",
      declineReason
    );

    if (result.success) {
      toast.success("Booking declined.");
      setShowDeclineDialog(false);
      setDeclineReason("");
      if (refreshData) {
        await refreshData();
      }
    }

    setIsProcessing(false);
  };

  return (
    <div
      className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white"
      onClick={handleCardClick}
    >
      {/* Full width image - no gap at top */}
      <div className="relative h-64 w-full overflow-hidden flex-shrink-0">
        <img
          src={booking.image || "/placeholder.jpg"}
          alt={booking.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <Badge
          className={`absolute top-4 left-4 font-medium px-3 py-1 ${getStatusStyle(
            booking.status
          )}`}
        >
          {booking.status}
        </Badge>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-bold text-xl text-gray-900 mb-2">
          {booking.title}
        </h3>

        {/* Info cho Tourist: hiển thị guide name */}
        {booking.guideName && !showActions && (
          <p className="text-sm text-gray-600 mb-3">
            Tour guide:{" "}
            <span className="font-semibold">{booking.guideName}</span>
          </p>
        )}

        {/* Info cho Guide: hiển thị tourist name */}
        {booking.touristName && showActions && (
          <p className="text-sm text-gray-600 mb-3">
            Tourist:{" "}
            {booking.touristName ? (
              <button
                type="button"
                onClick={handleTouristClick}
                className="font-semibold text-[#068F64] hover:underline focus:outline-none cursor-pointer"
              >
                {booking.touristName}
              </button>
            ) : (
              <span className="font-semibold">{booking.touristName}</span>
            )}
          </p>
        )}

        {/* Booking details in 2 columns */}
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
          {booking.tourDate && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {new Date(booking.tourDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {booking.tourTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{booking.tourTime}</span>
            </div>
          )}

          {booking.number_of_guests && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>
                {booking.number_of_guests} guest
                {booking.number_of_guests > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {booking.totalPrice && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 flex-shrink-0 text-green-600" />
              <span className="font-semibold text-green-600 truncate">
                {booking.totalPrice.toLocaleString()} ₫
              </span>
            </div>
          )}
        </div>

        {/* Actions for Guide (Accept/Decline) - push to bottom */}
        {showActions && booking.status_key === "pending" && (
          <div className="flex items-center gap-3 mb-3 mt-auto">
            <Button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 bg-[#068F64] rounded-full border border-transparent hover:bg-white hover:border-black hover:text-black text-white h-10 transition-all"
              // className="flex items-center gap-2 bg-[#068F64] rounded-full hover:bg-white hover:border-black hover:text-black hover:border-1 text-white"
              // className="w-full bg-green-600 hover:bg-green-700 rounded-full h-10"
            >
              {isProcessing ? "Processing..." : "Accept"}
            </Button>

            <AlertDialog
              open={showDeclineDialog}
              onOpenChange={setShowDeclineDialog}
            >
              <AlertDialogTrigger asChild>
                <Button
                  disabled={isProcessing}
                  onMouseDown={(e) => e.stopPropagation()}
                  variant="outline"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 rounded-full h-10 border bg-[#CC3737] hover:bg-white hover:border-black hover:text-black text-white"
                  // className="w-full rounded-full h-10 border-red-300 text-red-600 hover:bg-red-50"
                >
                  Decline
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Decline Booking Request</AlertDialogTitle>
                  <AlertDialogDescription>
                    Please provide a reason for declining this booking request.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Reason for declining..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="min-h-[100px]"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDecline}
                    disabled={isProcessing || !declineReason.trim()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isProcessing ? "Processing..." : "Decline Booking"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* View details button - push to bottom if no actions */}
        {/* <Button asChild className={`w-full bg-green-600 hover:bg-green-700 rounded-full h-12 ${!showActions || booking.status_key !== "pending" ? 'mt-auto' : ''}`}>
          <Link to={`/tour/${booking.tourId}`}>View tour</Link>
        </Button> */}
      </div>
    </div>
  );
}
