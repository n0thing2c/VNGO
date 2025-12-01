import { useAuthStore } from "../../stores/useAuthStore";

class NotificationService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.heartbeatInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = import.meta.env.MODE === 'development' ? "localhost:8000" : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/notify/?token=${encodeURIComponent(accessToken)}`;

    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log("Notification WebSocket connected");
        this.reconnectAttempts = 0;
        // Start heartbeat to keep online status alive
        this.startHeartbeat();
      };
      
      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type !== "heartbeat_ack") {
            this.emit("notification", data);
          }
        } catch {}
      };
      
      this.ws.onclose = (event) => {
        console.log("Notification WebSocket closed", event.code);
        this.stopHeartbeat();
        
        // Auto reconnect if not normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * this.reconnectAttempts, 10000);
          setTimeout(() => this.connect(), delay);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error("Notification WebSocket error:", error);
      };
    } catch (error) {
      console.error("Error creating notification WebSocket:", error);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    // Send heartbeat every 2 minutes to refresh online status (before 5 min timeout)
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 120000); // 2 minutes
    
    // Send first heartbeat immediately
    this.sendHeartbeat();
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  sendHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "heartbeat" }));
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
  }

  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(cb);
  }

  off(event, cb) {
    if (!this.listeners.has(event)) return;
    const list = this.listeners.get(event);
    const i = list.indexOf(cb);
    if (i >= 0) list.splice(i, 1);
  }

  emit(event, payload) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach((cb) => {
      try { cb(payload); } catch {}
    });
  }
}

export const notificationService = new NotificationService();
