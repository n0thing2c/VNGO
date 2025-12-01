/**
 * IncomingCallModal - Modal for incoming call notifications
 * 
 * Shows caller info and accept/reject buttons
 * Plays ringtone animation
 */

import React, { useEffect, useState } from "react";
import { Phone, PhoneOff, Video, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IncomingCallModal({ caller, callType, onAccept, onReject }) {
  const [isRinging, setIsRinging] = useState(true);

  // Pulse animation for ringing
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRinging((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const isVideoCall = callType === "video";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl shadow-2xl">
        {/* Animated background rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`absolute w-48 h-48 rounded-full border-2 border-emerald-500/30 transition-transform duration-500 ${
              isRinging ? "scale-100 opacity-100" : "scale-150 opacity-0"
            }`}
          />
          <div
            className={`absolute w-64 h-64 rounded-full border-2 border-emerald-500/20 transition-transform duration-700 ${
              isRinging ? "scale-100 opacity-100" : "scale-150 opacity-0"
            }`}
          />
          <div
            className={`absolute w-80 h-80 rounded-full border-2 border-emerald-500/10 transition-transform duration-1000 ${
              isRinging ? "scale-100 opacity-100" : "scale-150 opacity-0"
            }`}
          />
        </div>

        <div className="relative z-10 p-8 text-center">
          {/* Call type indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {isVideoCall ? (
              <Video className="w-5 h-5 text-emerald-400" />
            ) : (
              <Phone className="w-5 h-5 text-emerald-400" />
            )}
            <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">
              Incoming {isVideoCall ? "Video" : "Voice"} Call
            </span>
          </div>

          {/* Caller avatar */}
          <div className="relative mx-auto mb-6 w-28 h-28">
            <div
              className={`absolute inset-0 rounded-full bg-emerald-500/20 transition-transform duration-300 ${
                isRinging ? "scale-110" : "scale-100"
              }`}
            />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center overflow-hidden">
              {caller?.caller_avatar ? (
                <img
                  src={caller.caller_avatar}
                  alt={caller.caller_username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-14 h-14 text-white" />
              )}
            </div>
          </div>

          {/* Caller name */}
          <h2 className="text-2xl font-bold text-white mb-2">
            {caller?.caller_username || "Unknown Caller"}
          </h2>
          <p className="text-slate-400 mb-8">is calling you...</p>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-6">
            {/* Reject button */}
            <Button
              onClick={() => onReject("declined")}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all hover:scale-110"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </Button>

            {/* Accept button */}
            <Button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 animate-pulse"
            >
              {isVideoCall ? (
                <Video className="w-7 h-7 text-white" />
              ) : (
                <Phone className="w-7 h-7 text-white" />
              )}
            </Button>
          </div>

          {/* Labels */}
          <div className="flex items-center justify-center gap-16 mt-4">
            <span className="text-sm text-slate-400">Decline</span>
            <span className="text-sm text-slate-400">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallModal;

