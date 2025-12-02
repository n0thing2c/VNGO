/**
 * CallProvider - Global Context for Call Management
 * 
 * Wraps the application to provide call state and actions globally
 * Handles incoming call notifications and renders call UI components
 */

import React, { createContext, useContext, useEffect, useCallback, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { callNotifyService } from "@/services/callNotifyService";
import { webrtcService } from "@/services/webrtcService";
import { useAuthStore } from "../../../stores/useAuthStore";
import IncomingCallModal from "./IncomingCallModal";
import CallScreen from "./CallScreen";

// Create context
const CallContext = createContext(null);

// Hook to use call context
export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}

export function CallProvider({ children }) {
  const { accessToken, user } = useAuthStore();
  const webrtc = useWebRTC();
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [pendingIncomingCall, setPendingIncomingCall] = useState(null);
  const [acceptedCallInfo, setAcceptedCallInfo] = useState(null);

  // Connect to call notification service when authenticated (only once)
  useEffect(() => {
    if (accessToken) {
      console.log("CallProvider: Connecting to call notification service");
      callNotifyService.connect();

      // Listen for incoming calls from notification service
      const handleIncomingCall = (data) => {
        console.log("CallProvider: Received incoming call notification", data);
        // Set the pending incoming call to show the modal
        setPendingIncomingCall(data);
      };

      const handleCallCancelled = (data) => {
        console.log("CallProvider: Call cancelled", data);
        setPendingIncomingCall(null);
        callNotifyService.stopRingtone();
      };

      callNotifyService.on("incoming_call", handleIncomingCall);
      callNotifyService.on("call_cancelled", handleCallCancelled);

      return () => {
        callNotifyService.off("incoming_call", handleIncomingCall);
        callNotifyService.off("call_cancelled", handleCallCancelled);
        // Don't disconnect on cleanup - keep connection alive
      };
    }
  }, [accessToken]); // Remove webrtc.isInCall dependency to prevent reconnection loops

  // Show call screen when in call
  useEffect(() => {
    // Show if we're in a call OR if we just accepted a call (acceptedCallInfo exists)
    if ((webrtc.isInCall || acceptedCallInfo) && !webrtc.hasIncomingCall && !pendingIncomingCall) {
      setShowCallScreen(true);
    } else if (webrtc.callState.status === "ended") {
      // Only hide when call actually ended, not when idle
      // Delay hiding to show end animation
      const timer = setTimeout(() => {
        setShowCallScreen(false);
        setAcceptedCallInfo(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [webrtc.isInCall, webrtc.hasIncomingCall, webrtc.callState.status, pendingIncomingCall, acceptedCallInfo]);

  // Start a call to a user
  const callUser = useCallback((userId, userName, isVideo = false) => {
    console.log("CallProvider: Starting call to", userName, "(", userId, ")");
    webrtc.startCall(userId, userName, isVideo);
    setShowCallScreen(true);
  }, [webrtc]);

  // Accept incoming call (from callNotifyService)
  const acceptIncomingCall = useCallback(async () => {
    const callData = pendingIncomingCall || webrtc.incomingCall;
    if (!callData) {
      console.error("No incoming call data to accept");
      return;
    }

    console.log("CallProvider: Accepting call", callData);
    callNotifyService.stopRingtone();
    
    // Store caller info before clearing pendingIncomingCall
    const callerInfo = {
      id: callData.caller_id,
      username: callData.caller_username,
      avatar: callData.caller_avatar,
    };
    console.log("CallProvider: Caller info:", callerInfo);
    
    setPendingIncomingCall(null);
    setAcceptedCallInfo({
      callId: callData.call_id,
      callType: callData.call_type,
      caller: callerInfo,
      isIncoming: true,
    });

    // Show call screen IMMEDIATELY when user accepts
    // Even if media fails, user should see the call screen
    setShowCallScreen(true);

    try {
      // Connect to the call room and accept
      const success = await webrtcService.acceptCall(
        callData.call_id,
        callData.call_type === "video"
      );

      if (!success) {
        console.warn("acceptCall returned false, but keeping call screen open");
      }
    } catch (error) {
      console.error("Error accepting call:", error);
      // Keep call screen open even on error - user can see the connection status
    }
  }, [pendingIncomingCall, webrtc.incomingCall]);

  // Reject incoming call
  const rejectIncomingCall = useCallback((reason = "declined") => {
    const callData = pendingIncomingCall || webrtc.incomingCall;
    if (callData) {
      console.log("CallProvider: Rejecting call", callData);
      // Connect briefly to send rejection
      webrtcService.connectSignaling(callData.call_id).then(() => {
        webrtcService.rejectCall(callData.call_id, reason);
      }).catch(console.error);
    }
    callNotifyService.stopRingtone();
    setPendingIncomingCall(null);
    webrtc.rejectCall(reason);
  }, [pendingIncomingCall, webrtc]);

  // End current call
  const endCurrentCall = useCallback(() => {
    webrtc.endCall();
  }, [webrtc]);

  // Close call screen
  const closeCallScreen = useCallback(() => {
    webrtc.resetCall();
    setShowCallScreen(false);
    setPendingIncomingCall(null);
    setAcceptedCallInfo(null);
  }, [webrtc]);

  // Combined incoming call (from notify service or webrtc)
  const hasAnyIncomingCall = !!pendingIncomingCall || webrtc.hasIncomingCall;
  const currentIncomingCall = pendingIncomingCall || webrtc.incomingCall;

  // Merge callState with acceptedCallInfo for callee
  const mergedCallState = acceptedCallInfo ? {
    ...webrtc.callState,
    callId: acceptedCallInfo.callId,
    callType: acceptedCallInfo.callType,
    caller: acceptedCallInfo.caller,
    isIncoming: true,
  } : webrtc.callState;

  // Debug log
  if (showCallScreen) {
    console.log("CallScreen showing with callState:", mergedCallState);
  }

  // Context value
  const value = {
    // State
    callState: mergedCallState,
    mediaState: webrtc.mediaState,
    incomingCall: currentIncomingCall,
    callDuration: webrtc.formattedDuration,
    isInCall: webrtc.isInCall || !!acceptedCallInfo,
    isConnected: webrtc.isConnected,
    hasIncomingCall: hasAnyIncomingCall,

    // Actions
    callUser,
    acceptCall: acceptIncomingCall,
    rejectCall: rejectIncomingCall,
    endCall: endCurrentCall,
    toggleAudio: webrtc.toggleAudio,
    toggleVideo: webrtc.toggleVideo,
    closeCallScreen,
  };

  return (
    <CallContext.Provider value={value}>
      {children}

      {/* Incoming Call Modal */}
      {hasAnyIncomingCall && (
        <IncomingCallModal
          caller={currentIncomingCall}
          callType={currentIncomingCall?.call_type}
          onAccept={acceptIncomingCall}
          onReject={rejectIncomingCall}
        />
      )}

      {/* Call Screen (full screen overlay) */}
      {showCallScreen && !hasAnyIncomingCall && (
        <CallScreen
          callState={mergedCallState}
          mediaState={webrtc.mediaState}
          callDuration={webrtc.formattedDuration}
          onEndCall={endCurrentCall}
          onToggleAudio={webrtc.toggleAudio}
          onToggleVideo={webrtc.toggleVideo}
          onClose={closeCallScreen}
        />
      )}
    </CallContext.Provider>
  );
}

export default CallProvider;

