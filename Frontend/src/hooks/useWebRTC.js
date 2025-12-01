/**
 * useWebRTC Hook
 * 
 * Custom React hook for managing WebRTC calls
 * Provides a clean interface to the webrtcService
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { webrtcService } from "@/services/webrtcService";

export function useWebRTC() {
  const [callState, setCallState] = useState({
    status: "idle", // idle | calling | ringing | connected | ended
    callId: null,
    callType: null, // audio | video
    isIncoming: false,
    caller: null,
    callee: null,
    error: null,
  });

  const [mediaState, setMediaState] = useState({
    localStream: null,
    remoteStream: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    iceConnectionState: null,
    hasAudioPermission: true,  // Assume true until denied
    hasVideoPermission: true,  // Assume true until denied
  });

  const [incomingCall, setIncomingCall] = useState(null);
  const callTimerRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);

  // Cleanup on page unload (browser close, refresh, navigate away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log("Page unloading - cleaning up WebRTC");
      webrtcService.cleanup();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handlers = {
      local_stream: (stream) => {
        setMediaState((prev) => ({ 
          ...prev, 
          localStream: stream,
          hasAudioPermission: stream?.getAudioTracks().length > 0,
          hasVideoPermission: stream?.getVideoTracks().length > 0,
        }));
      },
      remote_stream: (stream) => {
        setMediaState((prev) => ({ ...prev, remoteStream: stream }));
      },
      incoming_call: (data) => {
        setIncomingCall(data);
        setCallState((prev) => ({
          ...prev,
          status: "ringing",
          isIncoming: true,
          callId: data.call_id,
          callType: data.call_type,
          caller: {
            id: data.caller_id,
            username: data.caller_username,
          },
        }));
      },
      call_accepted: (data) => {
        setCallState((prev) => ({
          ...prev,
          status: "connecting",
        }));
        // Note: createOffer is now called automatically in webrtcService.handleSignalingMessage
      },
      call_initiated: (data) => {
        // Caller received confirmation, now in the real call room
        setCallState((prev) => ({
          ...prev,
          callId: data.call_id,
          status: "calling", // Still calling, waiting for callee to accept
        }));
      },
      call_rejected: (data) => {
        setCallState((prev) => ({
          ...prev,
          status: "ended",
          error: `Call rejected: ${data.reason || "declined"}`,
        }));
        stopCallTimer();
      },
      call_ended: (data) => {
        setCallState((prev) => ({
          ...prev,
          status: "ended",
        }));
        setIncomingCall(null);
        stopCallTimer();
      },
      call_connected: () => {
        setCallState((prev) => ({
          ...prev,
          status: "connected",
        }));
        startCallTimer();
      },
      call_disconnected: (data) => {
        setCallState((prev) => ({
          ...prev,
          status: "ended",
          error: `Connection lost: ${data.state}`,
        }));
        stopCallTimer();
      },
      ice_state_change: (state) => {
        setMediaState((prev) => ({ ...prev, iceConnectionState: state }));
      },
      audio_toggle: (enabled) => {
        setMediaState((prev) => ({ ...prev, isAudioEnabled: enabled }));
      },
      video_toggle: (enabled) => {
        setMediaState((prev) => ({ ...prev, isVideoEnabled: enabled }));
      },
      error: (data) => {
        setCallState((prev) => ({
          ...prev,
          error: data.message,
        }));
      },
      media_permission_denied: (data) => {
        console.log("Media permission denied:", data.message);
        // Update permission state based on what we have
        setMediaState((prev) => ({
          ...prev,
          hasAudioPermission: webrtcService.hasAudio(),
          hasVideoPermission: webrtcService.hasVideo(),
        }));
      },
      cleanup: () => {
        setMediaState({
          localStream: null,
          remoteStream: null,
          isAudioEnabled: true,
          isVideoEnabled: true,
          iceConnectionState: null,
          hasAudioPermission: true,
          hasVideoPermission: true,
        });
        setIncomingCall(null);
        stopCallTimer();
      },
    };

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      webrtcService.on(event, handler);
    });

    // Cleanup on unmount - IMPORTANT: release camera/mic
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        webrtcService.off(event, handler);
      });
      // Make sure to cleanup WebRTC resources when component unmounts
      webrtcService.cleanup();
    };
  }, [callState.isIncoming]);

  // Call timer management
  const startCallTimer = useCallback(() => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  // Format duration as mm:ss
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  /**
   * Initiate an outgoing call
   */
  const startCall = useCallback(async (calleeId, calleeName, isVideo = false) => {
    setCallState({
      status: "calling",
      callId: null,
      callType: isVideo ? "video" : "audio",
      isIncoming: false,
      caller: null,
      callee: { id: calleeId, username: calleeName },
      error: null,
    });

    try {
      // Connect to a temporary signaling channel
      // The actual call_id will be assigned by the server
      const tempCallId = `temp_${Date.now()}`;
      await webrtcService.connectSignaling(tempCallId);
      
      const success = await webrtcService.initiateCall(calleeId, isVideo);
      
      if (!success) {
        setCallState((prev) => ({
          ...prev,
          status: "ended",
          error: "Failed to start call",
        }));
      }
    } catch (error) {
      console.error("Error starting call:", error);
      setCallState((prev) => ({
        ...prev,
        status: "ended",
        error: error.message || "Failed to connect",
      }));
    }
  }, []);

  /**
   * Accept an incoming call
   */
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    const success = await webrtcService.acceptCall(
      incomingCall.call_id,
      incomingCall.call_type === "video"
    );

    if (success) {
      setCallState((prev) => ({
        ...prev,
        status: "connecting",
      }));
      setIncomingCall(null);
    } else {
      setCallState((prev) => ({
        ...prev,
        status: "ended",
        error: "Failed to accept call",
      }));
    }
  }, [incomingCall]);

  /**
   * Reject an incoming call
   */
  const rejectCall = useCallback((reason = "busy") => {
    if (incomingCall) {
      webrtcService.rejectCall(incomingCall.call_id, reason);
    }
    setCallState({
      status: "idle",
      callId: null,
      callType: null,
      isIncoming: false,
      caller: null,
      callee: null,
      error: null,
    });
    setIncomingCall(null);
  }, [incomingCall]);

  /**
   * End the current call
   */
  const endCall = useCallback(() => {
    webrtcService.endCall();
    setCallState((prev) => ({
      ...prev,
      status: "ended",
    }));
  }, []);

  /**
   * Toggle audio (mute/unmute)
   */
  const toggleAudio = useCallback(() => {
    return webrtcService.toggleAudio();
  }, []);

  /**
   * Toggle video (on/off)
   */
  const toggleVideo = useCallback(async () => {
    return await webrtcService.toggleVideo();
  }, []);

  /**
   * Reset call state to idle
   */
  const resetCall = useCallback(() => {
    webrtcService.cleanup();
    setCallState({
      status: "idle",
      callId: null,
      callType: null,
      isIncoming: false,
      caller: null,
      callee: null,
      error: null,
    });
    setCallDuration(0);
  }, []);

  return {
    // State
    callState,
    mediaState,
    incomingCall,
    callDuration,
    formattedDuration: formatDuration(callDuration),

    // Actions
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    resetCall,

    // Computed
    isInCall: ["calling", "ringing", "connecting", "connected"].includes(callState.status),
    isConnected: callState.status === "connected",
    hasIncomingCall: !!incomingCall,
  };
}

