import React from "react";
import { MessageCircleMore, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button.jsx";
import { useAuthStore } from "@/stores/useAuthStore.js";
import { useNavigate } from "react-router-dom";

const GuideSection = ({ guide }) => {
  const islogged = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state)=> state.user?.role)
  const navigate = useNavigate();

  if (!guide) return null; // no guide, render nothing

  const handleMessageClick = () => {
    if (!islogged) {
      navigate("/login"); // redirect to login if not logged in
    }
    else {
      // implement messaging functionality here
      console.log("Open chat with guide:", guide.id);
    }
  };

  return (
    <Card className="w-full bg-neutral-100 rounded-4xl p-4 flex flex-col sm:flex-row gap-4 items-center h-full">
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-gray-700"
        >
          {guide.name[0].toUpperCase()}
        </div>

        {/* Message button */}
        {userRole !== "guide" && (
          <Button
            className="bg-[#068F64] rounded-2xl w-fit h-fit text-[10px] flex items-center gap-1"
            onClick={handleMessageClick}
          >
            <MessageCircleMore /> Message {guide.name.trim().split(" ").slice(-1)}
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
          <span className="text-sm ml-1">({guide.rating})</span>
        </div>
      </div>
    </Card>
  );
};

export default GuideSection;
