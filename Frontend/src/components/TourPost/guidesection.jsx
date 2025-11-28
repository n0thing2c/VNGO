import React, { useMemo } from "react";
import { MessageCircleMore, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button.jsx";
import { useAuthStore } from "@/stores/useAuthStore.js";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constant.js";

const buildRoomName = (touristUsername, guideUsername) => {
  if (!touristUsername || !guideUsername) return null;
  return `${touristUsername}__${guideUsername}`;
};

const GuideSection = ({ guide }) => {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;
  const navigate = useNavigate();

  const guideInitial = guide?.name?.[0]?.toUpperCase() || guide?.username?.[0]?.toUpperCase() || "?";

  const chatPayload = useMemo(() => {
    if (!guide || !user) return null;
    const roomName = buildRoomName(user.username, guide.username);
    if (!roomName) return null;
    return {
      targetRoom: roomName,
      targetUser: {
        id: guide.id,
        username: guide.username,
        name: guide.name,
      },
    };
  }, [guide, user]);

  if (!guide) return null; // no guide, render nothing

  const handleViewProfile = () => {
    if (!guide?.id) return;
    navigate(ROUTES.PUBLIC_PROFILE(guide.id));
  };

  const handleMessageClick = () => {
    if (!user) {
      navigate("/login"); // redirect to login if not logged in
      return;
    }

    if (!chatPayload) return;

    navigate("/chat", {
      state: chatPayload,
    });
  };

  return (
    <Card className="w-full bg-neutral-100 rounded-4xl p-4 flex flex-col sm:flex-row gap-4 items-center h-full">
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        {/* Avatar */}
          <Button
            className="bg-transparent p-2 hover:bg-transparent flex mt-3 mb-3"
            onClick={handleViewProfile}
          >
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden text-xl font-bold text-gray-700">
          {guide.avatar ? (
            <img
              src={guide.avatar}
              alt={guide.name || guide.username}
              className="w-full h-full object-cover"
            />
          ) : (
            guideInitial
          )}
            </div>
          </Button>
        {/* Message button */}
        {userRole !== "guide" && (
          <Button
            className="bg-[#068F64] rounded-2xl w-auto h-auto text-[9px] flex items-center gap-1"
            onClick={handleMessageClick}
          >
            <MessageCircleMore /> Message{" "}
            {guide.name
              ? guide.name.trim().split(" ").slice(-1).join(" ")
              : guide.username}
          </Button>
        )}

      </div>

      <div className="flex-1 flex flex-col justify-center">
        <h3 className="text-lg font-semibold">{guide.name}</h3>
        <p className="text-gray-700 text-sm">Location: {guide.location}</p>
        <p className="text-gray-700 text-sm">Languages: {guide.languages.join(", ")}</p>
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < guide.rating ? "text-yellow-400" : "text-gray-300"}`}
              fill={i < guide.rating ? "currentColor" : "lightgray"}
              stroke="currentColor"
            />
          ))}
          <span className="text-sm ml-1"> {guide.rating.toFixed(1)} ({guide.rating_count} votes)</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">

        </div>
      </div>
    </Card>
  );
};

export default GuideSection;
