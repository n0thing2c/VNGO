/**
 * CallControls - Control buttons for call screen
 * 
 * Mute, camera toggle, and end call buttons
 */

import React from "react";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  X,
  MicOffIcon,
  VideoOffIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function CallControls({
  status,
  isVideoCall,
  isAudioEnabled,
  isVideoEnabled,
  hasAudioPermission = true,
  hasVideoPermission = true,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onClose,
}) {
  const isCallActive = ["calling", "ringing", "connecting", "connected"].includes(status);
  const isCallEnded = status === "ended";

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm border-t border-slate-700">
      <div className="max-w-md mx-auto px-6 py-6">
        <div className="flex items-center justify-center gap-6">
          {/* Mute/Unmute Audio */}
          {isCallActive && (
            <Button
              onClick={hasAudioPermission ? onToggleAudio : undefined}
              disabled={!hasAudioPermission}
              className={`w-14 h-14 rounded-full transition-all ${
                !hasAudioPermission
                  ? "bg-slate-600 cursor-not-allowed opacity-50"
                  : isAudioEnabled
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
              }`}
              title={
                !hasAudioPermission 
                  ? "Không có quyền microphone" 
                  : isAudioEnabled ? "Mute" : "Unmute"
              }
            >
              {isAudioEnabled && hasAudioPermission ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </Button>
          )}

          {/* End Call / Close */}
          {isCallActive ? (
            <Button
              onClick={onEndCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all hover:scale-105"
              title="End Call"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </Button>
          ) : (
            <Button
              onClick={onClose}
              className="w-16 h-16 rounded-full bg-slate-600 hover:bg-slate-500 transition-all hover:scale-105"
              title="Close"
            >
              <X className="w-7 h-7 text-white" />
            </Button>
          )}

          {/* Toggle Video (only for video calls) */}
          {isCallActive && isVideoCall && (
            <Button
              onClick={hasVideoPermission ? onToggleVideo : undefined}
              disabled={!hasVideoPermission}
              className={`w-14 h-14 rounded-full transition-all ${
                !hasVideoPermission
                  ? "bg-slate-600 cursor-not-allowed opacity-50"
                  : isVideoEnabled
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
              }`}
              title={
                !hasVideoPermission 
                  ? "Không có quyền camera" 
                  : isVideoEnabled ? "Turn off camera" : "Turn on camera"
              }
            >
              {isVideoEnabled && hasVideoPermission ? (
                <Video className="w-6 h-6" />
              ) : (
                <VideoOff className="w-6 h-6" />
              )}
            </Button>
          )}
        </div>

        {/* Permission warning */}
        {isCallActive && (!hasAudioPermission || !hasVideoPermission) && (
          <p className="text-center text-yellow-400 mt-4 text-sm">
            {!hasAudioPermission && !hasVideoPermission 
              ? "Chế độ chỉ xem (không có mic/camera)"
              : !hasAudioPermission 
                ? "Không có quyền microphone"
                : "Không có quyền camera"
            }
          </p>
        )}

        {/* Status text */}
        {isCallEnded && (
          <p className="text-center text-slate-400 mt-4 text-sm">
            Tap anywhere to close
          </p>
        )}
      </div>
    </div>
  );
}

export default CallControls;

