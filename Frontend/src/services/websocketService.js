import { useAuthStore } from "../../stores/useAuthStore";

class WebSocketService {
  constructor() {
    this.ws = null;
    this.roomName = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
  }

  connect(roomName) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.roomName === roomName) {
      return; // Already connected to this room
    }

    if (this.ws) {
      try {
        this.ws.close(1000, "Switch room");
      } catch (e) {
        console.error("Error closing existing WebSocket:", e);
      }
      this.ws = null;
    }

    this.roomName = roomName;
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      console.error("No access token available");
      return;
    }

    // Build WebSocket URL
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = import.meta.env.MODE === 'development' 
      ? "localhost:8000" 
      : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/${roomName}/`;

    try {
      const urlWithToken = `${wsUrl}?token=${encodeURIComponent(accessToken)}`;
      
      this.ws = new WebSocket(urlWithToken);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.emit("connected");
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit("message", data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.emit("error", error);
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket closed", event.code, event.reason);
        this.emit("disconnected");
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
            this.connect(roomName);
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      this.emit("error", error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.roomName = null;
    this.listeners.clear();
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "chat.message",
          message: message,
        })
      );
    } else {
      console.error("WebSocket is not connected");
    }
  }

  sendTyping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "typing",
        })
      );
    }
  }

  sendMarkSeen() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "mark_seen",
        })
      );
    }
  }

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
          console.error("Error in event listener:", error);
        }
      });
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();