/**
 * Call Notification Service
 * 
 * Maintains a persistent WebSocket connection to receive incoming call notifications
 * This runs in the background so users can receive calls anywhere in the app
 */

import { useAuthStore } from "../../stores/useAuthStore";

class CallNotifyService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000;
    this.isConnected = false;
  }

  /**
   * Connect to the call notification WebSocket
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) {
      console.log("CallNotifyService: No access token, skipping connection");
      return;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = import.meta.env.MODE === "development" 
      ? "localhost:8000" 
      : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/call-notify/?token=${encodeURIComponent(accessToken)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("CallNotifyService: Connected");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit("connected");
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("CallNotifyService: Error parsing message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("CallNotifyService: WebSocket error:", error);
        this.emit("error", error);
      };

      this.ws.onclose = (event) => {
        console.log("CallNotifyService: Disconnected", event.code);
        this.isConnected = false;
        this.emit("disconnected");
        
        // Attempt to reconnect
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`CallNotifyService: Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
          setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error("CallNotifyService: Error creating WebSocket:", error);
    }
  }

  /**
   * Disconnect from the notification WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  /**
   * Handle incoming messages
   */
  handleMessage(data) {
    const { type } = data;

    switch (type) {
      case "call.incoming":
        console.log("CallNotifyService: Incoming call", data);
        this.emit("incoming_call", data);
        // Play ringtone sound
        this.playRingtone();
        break;

      case "call.cancelled":
        console.log("CallNotifyService: Call cancelled", data);
        this.emit("call_cancelled", data);
        this.stopRingtone();
        break;

      default:
        console.log("CallNotifyService: Unknown message type:", type);
    }
  }

  /**
   * Play ringtone sound for incoming calls
   */
  playRingtone() {
    // Create audio context for ringtone
    // You can replace this with an actual audio file
    try {
      if (!this.ringtoneAudio) {
        this.ringtoneAudio = new Audio();
        // Use a simple beep pattern or load an actual ringtone file
        // this.ringtoneAudio.src = "/sounds/ringtone.mp3";
        this.ringtoneAudio.loop = true;
      }
      // Uncomment when you have an actual ringtone file
      // this.ringtoneAudio.play().catch(e => console.log("Cannot play ringtone:", e));
    } catch (error) {
      console.log("Ringtone error:", error);
    }
  }

  /**
   * Stop ringtone sound
   */
  stopRingtone() {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio.currentTime = 0;
    }
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
          console.error(`CallNotifyService: Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// Export singleton instance
export const callNotifyService = new CallNotifyService();

