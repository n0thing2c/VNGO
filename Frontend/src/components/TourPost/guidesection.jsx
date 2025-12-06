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
        avatar: guide.avatar,
        avatar_url: guide.avatar_url,
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
    <Card className="w-full bg-neutral-100 rounded-4xl px-6 py-4 flex flex-col sm:flex-row gap-8 items-center h-full">
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        {/* Avatar */}
        <Button
          className="bg-transparent p-0 hover:bg-transparent flex mt-1 mb-1 h-auto"
          onClick={handleViewProfile}
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden text-3xl font-bold text-gray-700 cursor-pointer">
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
            className="bg-[#068F64] rounded-2xl px-4 py-1 text-sm flex items-center gap-2"
            onClick={handleMessageClick}
          >
            <MessageCircleMore /> Message{" "}
            {/* {guide.name
              ? guide.name.trim().split(" ").slice(-1).join(" ")
              : guide.username} */}
          </Button>
        )}

      </div>

      <div className="flex-1 flex flex-col justify-center gap-1">
        <h3 className="text-xl font-bold">{guide.name}</h3>
        <p className="text-gray-700 text-base">Location: {guide.location}</p>
        <p className="text-gray-700 text-base">
          Languages:{" "}
          {guide.languages.length > 3
            ? `${guide.languages.slice(0, 3).join(", ")}, (+${guide.languages.length - 3})`
            : guide.languages.join(", ")}
        </p>
        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${i < guide.rating ? "text-yellow-400" : "text-gray-300"}`}
              fill={i < guide.rating ? "currentColor" : "lightgray"}
              stroke="currentColor"
            />
          ))}
          <span className="text-base ml-2"> {guide.rating.toFixed(1)} ({guide.rating_count} votes)</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">

        </div>
      </div>
    </Card>
  );
};

export default GuideSection;
