import { useAuthStore } from "../../stores/useAuthStore";

class NotificationService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
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
      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          this.emit("notification", data);
        } catch {}
      };
    } catch {}
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
