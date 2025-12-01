/**
 * CallScreen - Full screen call interface
 * 
 * Displays local/remote video streams, call controls, and status
 */

import React, { useRef, useEffect, useState } from "react";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  X,
  User,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CallControls from "./CallControls";

export function CallScreen({
  callState,
  mediaState,
  callDuration,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onClose,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isLocalVideoLarge, setIsLocalVideoLarge] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const { status, callType, callee, caller, isIncoming, error } = callState;
  const { 
    localStream, 
    remoteStream, 
    isAudioEnabled, 
    isVideoEnabled,
    hasAudioPermission = true,
    hasVideoPermission = true,
  } = mediaState;
  const isVideoCall = callType === "video";

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (status === "connected") {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, showControls]);

  // Get the other party's info
  const otherParty = isIncoming ? caller : callee;

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case "calling":
        return "Calling...";
      case "ringing":
        return "Ringing...";
      case "connecting":
        return "Connecting...";
      case "connected":
        return callDuration;
      case "ended":
        return error || "Call Ended";
      default:
        return "";
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99] bg-slate-900 flex flex-col"
      onMouseMove={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      {/* Video Container */}
      <div className="relative flex-1 overflow-hidden">
        {/* Remote Video (main view) */}
        {isVideoCall && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          // Audio call or no remote video - show avatar
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="text-center">
              {/* Avatar */}
              <div className="mx-auto mb-6 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center overflow-hidden shadow-2xl">
                {otherParty?.avatar ? (
                  <img
                    src={otherParty.avatar}
                    alt={otherParty.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>

              {/* Name */}
              <h2 className="text-3xl font-bold text-white mb-2">
                {otherParty?.username || "Unknown"}
              </h2>

              {/* Status */}
              <p className={`text-lg ${
                status === "connected" 
                  ? "text-emerald-400 font-mono" 
                  : "text-slate-400"
              }`}>
                {getStatusText()}
              </p>

              {/* Pulsing animation for connecting states */}
              {["calling", "ringing", "connecting"].includes(status) && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Local Video (picture-in-picture) */}
        {isVideoCall && localStream && (
          <div
            className={`absolute transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700 cursor-pointer ${
              isLocalVideoLarge
                ? "inset-0 m-4"
                : "bottom-24 right-4 w-32 h-44 md:w-48 md:h-64"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIsLocalVideoLarge(!isLocalVideoLarge);
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-slate-400" />
              </div>
            )}
            {/* Resize button */}
            <button
              className="absolute top-2 right-2 p-1 rounded bg-black/50 text-white hover:bg-black/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsLocalVideoLarge(!isLocalVideoLarge);
              }}
            >
              {isLocalVideoLarge ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Top bar with status */}
        <div 
          className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isVideoCall ? (
                <Video className="w-5 h-5 text-emerald-400" />
              ) : (
                <Phone className="w-5 h-5 text-emerald-400" />
              )}
              <span className="text-white font-medium">
                {otherParty?.username}
              </span>
            </div>

            {/* Close button (only when call ended) */}
            {status === "ended" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Call duration for video calls */}
          {isVideoCall && status === "connected" && (
            <div className="text-center mt-2">
              <span className="text-emerald-400 font-mono text-lg">
                {callDuration}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Call Controls */}
      <div 
        className={`transition-opacity duration-300 ${
          showControls || status !== "connected" ? "opacity-100" : "opacity-0"
        }`}
      >
        <CallControls
          status={status}
          isVideoCall={isVideoCall}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          hasAudioPermission={hasAudioPermission}
          hasVideoPermission={hasVideoPermission}
          onToggleAudio={onToggleAudio}
          onToggleVideo={onToggleVideo}
          onEndCall={onEndCall}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

export default CallScreen;

