/**
 * WebRTC Service for Video/Audio Calls
 * 
 * Handles peer-to-peer WebRTC connections with signaling through Django Channels
 * 
 * Flow:
 * 1. Caller initiates call via signaling WebSocket
 * 2. Callee receives notification and accepts/rejects
 * 3. If accepted, exchange SDP offers/answers
 * 4. Exchange ICE candidates for NAT traversal
 * 5. Establish P2P media connection
 */

import { useAuthStore } from "@/stores/useAuthStore";

// ICE Server configuration
const ICE_SERVERS = {
  iceServers: [
    // Google's free STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    // Add TURN servers for production (required for some NAT types)
    // {
    //   urls: "turn:your-turn-server.com:3478",
    //   username: "username",
    //   credential: "password"
    // }
  ],
  iceCandidatePoolSize: 10,
};

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.signalingSocket = null;
    this.currentCallId = null;
    this.isCallActive = false;
    this.listeners = new Map();
    this.connectionPromise = null;
    this.connectionResolve = null;
    
    // Media constraints
    this.audioConstraints = { audio: true, video: false };
    this.videoConstraints = { 
      audio: true, 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
      }
    };
  }

  /**
   * Connect to signaling server for a specific call
   * Returns a promise that resolves when connected
   */
  connectSignaling(callId) {
    return new Promise((resolve, reject) => {
      if (this.signalingSocket && this.signalingSocket.readyState === WebSocket.OPEN) {
        if (this.currentCallId === callId) {
          resolve();
          return;
        }
        this.disconnectSignaling();
      }

      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        console.error("No access token available");
        this.emit("error", { message: "Authentication required" });
        reject(new Error("Authentication required"));
        return;
      }

      this.currentCallId = callId;
      
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = import.meta.env.MODE === "development" 
        ? "localhost:8000" 
        : window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/ws/call/${callId}/?token=${encodeURIComponent(accessToken)}`;

      console.log("Connecting to signaling server:", wsUrl);

      try {
        this.signalingSocket = new WebSocket(wsUrl);

        this.signalingSocket.onopen = () => {
          console.log("WebRTC signaling connected");
          this.emit("signaling_connected");
          resolve();
        };

        this.signalingSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("Received signaling message:", data);
            this.handleSignalingMessage(data);
          } catch (error) {
            console.error("Error parsing signaling message:", error);
          }
        };

        this.signalingSocket.onerror = (error) => {
          console.error("Signaling WebSocket error:", error);
          this.emit("signaling_error", error);
          reject(error);
        };

        this.signalingSocket.onclose = (event) => {
          console.log("Signaling WebSocket closed:", event.code, event.reason);
          this.emit("signaling_disconnected");
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.signalingSocket?.readyState !== WebSocket.OPEN) {
            reject(new Error("Connection timeout"));
          }
        }, 5000);
      } catch (error) {
        console.error("Error creating signaling WebSocket:", error);
        this.emit("error", { message: "Failed to connect to signaling server" });
        reject(error);
      }
    });
  }

  /**
   * Disconnect from signaling server
   */
  disconnectSignaling() {
    if (this.signalingSocket) {
      this.signalingSocket.close(1000, "Client disconnect");
      this.signalingSocket = null;
    }
    this.currentCallId = null;
  }

  /**
   * Handle incoming signaling messages
   */
  handleSignalingMessage(data) {
    const { type } = data;

    switch (type) {
      case "call.initiated":
        // Server confirmed call creation - switch to the real call room
        console.log("Call initiated, switching to real call room:", data.call_id);
        this.handleCallInitiated(data);
        break;

      case "call.incoming":
        this.emit("incoming_call", data);
        break;

      case "call.accepted":
        console.log("Call accepted by callee");
        this.emit("call_accepted", data);
        // Only CALLER should create the offer, not the callee
        if (this.isCaller) {
          console.log("I am the caller, creating WebRTC offer...");
          this.createOffer();
        } else {
          console.log("I am the callee, waiting for offer from caller...");
        }
        break;

      case "call.rejected":
        this.emit("call_rejected", data);
        this.cleanup();
        break;

      case "call.ended":
        this.emit("call_ended", data);
        this.cleanup();
        break;

      case "webrtc.offer":
        this.handleOffer(data);
        break;

      case "webrtc.answer":
        this.handleAnswer(data);
        break;

      case "webrtc.ice_candidate":
        this.handleIceCandidate(data);
        break;

      case "user_joined":
        console.log("User joined call room:", data);
        this.emit("user_joined", data);
        break;

      case "user_left":
        this.emit("user_left", data);
        // If the other user left, end the call
        if (this.isCallActive) {
          this.emit("call_ended", { reason: "user_left" });
          this.cleanup();
        }
        break;

      case "error":
        console.error("Signaling error:", data.message);
        this.emit("error", data);
        break;

      default:
        console.log("Unknown signaling message type:", type, data);
    }
  }

  /**
   * Handle call.initiated - switch from temp room to real call room
   */
  async handleCallInitiated(data) {
    const { call_id } = data;
    
    // Store that we're the caller
    this.isCaller = true;
    this.realCallId = call_id;
    
    // Disconnect from temp room and connect to real call room
    console.log("Switching from temp room to real call room:", call_id);
    
    // Close current connection
    if (this.signalingSocket) {
      this.signalingSocket.close(1000, "Switching to real call room");
    }
    
    // Connect to the real call room
    try {
      await this.connectSignaling(call_id);
      console.log("Connected to real call room:", call_id);
      this.emit("call_initiated", data);
    } catch (error) {
      console.error("Failed to connect to real call room:", error);
      this.emit("error", { message: "Failed to connect to call room" });
    }
  }

  /**
   * Get user media (camera/microphone)
   * Tries to get audio and video SEPARATELY so one can succeed even if the other fails
   * NEVER throws - always returns a stream (possibly empty)
   */
  async getUserMedia(isVideo = false) {
    const combinedStream = new MediaStream();

    // Try to get AUDIO first (always needed)
    try {
      console.log("Requesting audio permission...");
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
        console.log("Audio track added:", track.label);
      });
      this.hasAudioPermission = true;
    } catch (error) {
      console.warn("Could not get audio:", error.name, error.message);
      this.hasAudioPermission = false;
    }

    // Try to get VIDEO (only for video calls)
    if (isVideo) {
      try {
        console.log("Requesting video permission...");
        const videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });
        videoStream.getVideoTracks().forEach(track => {
          combinedStream.addTrack(track);
          console.log("Video track added:", track.label);
        });
        this.hasVideoPermission = true;
      } catch (error) {
        console.warn("Could not get video:", error.name, error.message);
        this.hasVideoPermission = false;
      }
    }

    // Check what we got
    const hasAudio = combinedStream.getAudioTracks().length > 0;
    const hasVideo = combinedStream.getVideoTracks().length > 0;

    console.log(`Media result: audio=${hasAudio}, video=${hasVideo}`);

    // Set local stream (even if empty - receive-only mode)
    this.localStream = combinedStream;
    
    // Emit warnings for failures (but DON'T throw)
    if (!hasAudio && !hasVideo) {
      console.warn("No media permissions - receive-only mode");
      this.emit("media_warning", { 
        message: "Không có quyền camera/microphone. Bạn sẽ chỉ có thể nghe/xem.",
        hasAudio: false,
        hasVideo: false,
      });
    } else if (isVideo) {
      if (!hasAudio) {
        this.emit("media_warning", { 
          message: "Không có quyền microphone. Bạn sẽ không thể nói.",
          hasAudio: false,
          hasVideo: true,
        });
      } else if (!hasVideo) {
        this.emit("media_warning", { 
          message: "Không có quyền camera. Bạn sẽ không thể bật video.",
          hasAudio: true,
          hasVideo: false,
        });
      }
    } else {
      // Audio call
      if (!hasAudio) {
        this.emit("media_warning", { 
          message: "Không có quyền microphone. Bạn sẽ chỉ có thể nghe.",
          hasAudio: false,
          hasVideo: false,
        });
      }
    }

    this.emit("local_stream", combinedStream);
    return combinedStream;
  }

  /**
   * Create RTCPeerConnection
   */
  createPeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.remoteStream = new MediaStream();

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle incoming tracks
    this.peerConnection.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream.addTrack(track);
      });
      this.emit("remote_stream", this.remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: "webrtc.ice_candidate",
          call_id: this.currentCallId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", this.peerConnection.iceConnectionState);
      this.emit("ice_state_change", this.peerConnection.iceConnectionState);

      if (this.peerConnection.iceConnectionState === "connected") {
        this.isCallActive = true;
        this.emit("call_connected");
      } else if (
        this.peerConnection.iceConnectionState === "disconnected" ||
        this.peerConnection.iceConnectionState === "failed"
      ) {
        this.emit("call_disconnected", { 
          state: this.peerConnection.iceConnectionState 
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", this.peerConnection.connectionState);
      this.emit("connection_state_change", this.peerConnection.connectionState);
    };

    return this.peerConnection;
  }

  /**
   * Initiate a call (caller side)
   */
  async initiateCall(calleeId, isVideo = false) {
    try {
      // Store call type for later use
      this.pendingCallType = isVideo ? "video" : "audio";
      this.isCaller = true;
      
      // Reset permissions - will be set by getUserMedia
      this.hasAudioPermission = false;
      this.hasVideoPermission = false;
      
      // Wait for socket to be ready (with retries)
      let retries = 0;
      while ((!this.signalingSocket || this.signalingSocket.readyState !== WebSocket.OPEN) && retries < 10) {
        console.log("Waiting for signaling socket to be ready...", retries);
        await new Promise(resolve => setTimeout(resolve, 200));
        retries++;
      }

      if (!this.signalingSocket || this.signalingSocket.readyState !== WebSocket.OPEN) {
        throw new Error("Signaling socket not ready");
      }
      
      // Send call initiation through signaling FIRST (so callee gets notified)
      console.log("Sending call initiation to callee:", calleeId);
      this.sendSignalingMessage({
        type: "call.initiate",
        callee_id: calleeId,
        call_type: isVideo ? "video" : "audio",
      });

      // Get user media (never throws, just sets permissions)
      await this.getUserMedia(isVideo);

      // Log current permission state
      console.log(`Caller permissions: audio=${this.hasAudioPermission}, video=${this.hasVideoPermission}`);

      return true;
    } catch (error) {
      console.error("Error initiating call:", error);
      return false;
    }
  }

  /**
   * Accept an incoming call (callee side)
   * Even if media permission is denied, still join the call (receive-only mode)
   */
  async acceptCall(callId, isVideo = false) {
    try {
      // Mark as callee (NOT the caller)
      this.isCaller = false;
      this.pendingCallType = isVideo ? "video" : "audio";
      
      // Reset permissions - will be set by getUserMedia
      this.hasAudioPermission = false;
      this.hasVideoPermission = false;
      
      // Connect to call signaling room
      await this.connectSignaling(callId);
      
      // Get user media (never throws, just sets permissions)
      await this.getUserMedia(isVideo);
      
      // Log current permission state
      console.log(`Callee permissions: audio=${this.hasAudioPermission}, video=${this.hasVideoPermission}`);
      
      // Create peer connection (callee prepares to receive offer)
      // This works even without local media - we can still receive
      this.createPeerConnection();

      // Send accept message
      console.log("Sending call.accept for call:", callId);
      this.sendSignalingMessage({
        type: "call.accept",
        call_id: callId,
      });

      return true;
    } catch (error) {
      console.error("Error accepting call:", error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Reject an incoming call
   */
  rejectCall(callId, reason = "rejected") {
    this.sendSignalingMessage({
      type: "call.reject",
      call_id: callId,
      reason: reason,
    });
    this.cleanup();
  }

  /**
   * End the current call
   */
  endCall() {
    if (this.currentCallId) {
      this.sendSignalingMessage({
        type: "call.end",
        call_id: this.currentCallId,
      });
    }
    this.cleanup();
  }

  /**
   * Create and send SDP offer (caller side)
   */
  async createOffer() {
    console.log("Creating WebRTC offer...");
    
    // Ensure we have local stream (even if empty)
    if (!this.localStream) {
      const isVideo = this.pendingCallType === "video";
      await this.getUserMedia(isVideo);
    }
    
    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    try {
      // Create offer - we ALWAYS want to receive audio/video even if we can't send
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.pendingCallType === "video",
      });
      
      await this.peerConnection.setLocalDescription(offer);
      
      console.log("Sending WebRTC offer to call:", this.currentCallId);
      this.sendSignalingMessage({
        type: "webrtc.offer",
        call_id: this.currentCallId,
        sdp: offer,
      });

      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
  }

  /**
   * Handle incoming SDP offer (callee side)
   */
  async handleOffer(data) {
    const { sdp, call_id } = data;

    // Only the callee should handle offers
    if (this.isCaller) {
      console.log("Ignoring offer - I am the caller");
      return;
    }

    console.log("Received WebRTC offer, creating answer...");

    if (!this.peerConnection) {
      this.createPeerConnection();
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      console.log("Sending WebRTC answer");
      this.sendSignalingMessage({
        type: "webrtc.answer",
        call_id: call_id,
        sdp: answer,
      });
    } catch (error) {
      console.error("Error handling offer:", error);
      this.emit("error", { message: "Failed to process call offer" });
    }
  }

  /**
   * Handle incoming SDP answer (caller side)
   */
  async handleAnswer(data) {
    const { sdp } = data;

    // Only the caller should handle answers
    if (!this.isCaller) {
      console.log("Ignoring answer - I am not the caller");
      return;
    }

    // Check if we're in the right state to receive an answer
    if (!this.peerConnection || this.peerConnection.signalingState !== "have-local-offer") {
      console.log("Ignoring answer - not in correct state:", this.peerConnection?.signalingState);
      return;
    }

    try {
      console.log("Setting remote description (answer)");
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (error) {
      console.error("Error handling answer:", error);
      this.emit("error", { message: "Failed to process call answer" });
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(data) {
    const { candidate } = data;

    if (!candidate || !this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  }

  /**
   * Send message through signaling WebSocket
   */
  sendSignalingMessage(message) {
    if (this.signalingSocket && this.signalingSocket.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify(message));
    } else {
      console.error("Signaling socket not connected");
    }
  }

  /**
   * Toggle local audio (mute/unmute)
   */
  toggleAudio() {
    // Check if we have audio permission
    if (!this.hasAudioPermission && !this.localStream?.getAudioTracks().length) {
      console.warn("No audio permission - cannot toggle");
      this.emit("error", { 
        message: "Không có quyền truy cập microphone",
        recoverable: true 
      });
      return false;
    }
    
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.emit("audio_toggle", audioTrack.enabled);
        return audioTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Toggle local video (on/off)
   */
  async toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      
      if (videoTrack) {
        // Have video track - just toggle it
        videoTrack.enabled = !videoTrack.enabled;
        this.emit("video_toggle", videoTrack.enabled);
        return videoTrack.enabled;
      } else {
        // No video track - try to add one (user wants to turn on camera)
        console.log("No video track, trying to add camera...");
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
          });
          
          const newVideoTrack = videoStream.getVideoTracks()[0];
          if (newVideoTrack) {
            // Add to local stream
            this.localStream.addTrack(newVideoTrack);
            
            // Add to peer connection if exists
            if (this.peerConnection) {
              const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
              if (sender) {
                await sender.replaceTrack(newVideoTrack);
              } else {
                this.peerConnection.addTrack(newVideoTrack, this.localStream);
              }
            }
            
            this.emit("local_stream", this.localStream);
            this.emit("video_toggle", true);
            console.log("Camera added successfully");
            return true;
          }
        } catch (error) {
          console.error("Could not add camera:", error);
          this.emit("error", { 
            message: "Cannot access camera. It may be in use by another app.",
            recoverable: true 
          });
        }
      }
    }
    return false;
  }

  /**
   * Check if audio is enabled
   */
  isAudioEnabled() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      return audioTrack ? audioTrack.enabled : false;
    }
    return false;
  }

  /**
   * Check if video is enabled
   */
  isVideoEnabled() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      return videoTrack ? videoTrack.enabled : false;
    }
    return false;
  }

  /**
   * Cleanup all resources - MUST release camera/mic
   */
  cleanup() {
    console.log("Cleaning up WebRTC resources...");

    // Stop ALL local stream tracks (camera & mic)
    if (this.localStream) {
      console.log("Stopping local stream tracks...");
      this.localStream.getTracks().forEach((track) => {
        console.log(`Stopping track: ${track.kind} (${track.label})`);
        track.stop();
        track.enabled = false;
      });
      this.localStream = null;
    }

    // Stop remote stream tracks too (just in case)
    if (this.remoteStream) {
      console.log("Stopping remote stream tracks...");
      this.remoteStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      this.remoteStream = null;
    }

    // Close peer connection and release all senders
    if (this.peerConnection) {
      console.log("Closing peer connection...");
      // Remove all tracks from senders
      this.peerConnection.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
        try {
          this.peerConnection.removeTrack(sender);
        } catch (e) {
          // Ignore errors when removing tracks
        }
      });
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Disconnect signaling
    this.disconnectSignaling();

    // Reset all state
    this.isCallActive = false;
    this.isCaller = false;
    this.pendingCallType = null;
    this.realCallId = null;
    this.hasAudioPermission = false;
    this.hasVideoPermission = false;
    
    console.log("Cleanup complete - camera/mic should be released");
    this.emit("cleanup");
  }

  /**
   * Check if we have audio permission
   */
  hasAudio() {
    return this.hasAudioPermission || (this.localStream?.getAudioTracks().length > 0);
  }

  /**
   * Check if we have video permission
   */
  hasVideo() {
    return this.hasVideoPermission || (this.localStream?.getVideoTracks().length > 0);
  }

  // ==================== Event Emitter ====================

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  removeAllListeners() {
    this.listeners.clear();
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService();

