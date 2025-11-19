import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Send, Star } from "lucide-react";
import { websocketService } from "@/services/websocketService";
import { chatService } from "@/services/chatService";
import { useAuthStore } from "../../../stores/useAuthStore";

const normalizeMessages = (items = []) => {
  const map = new Map();

  items.forEach((item) => {
    if (!item) {
      return;
    }

    const createdAt = item.created_at || new Date().toISOString();
    const key = item.id != null ? `id_${item.id}` : `sender_${item.sender?.id || "unknown"}_${createdAt}_${item.content}`;

    if (!map.has(key)) {
      map.set(key, {
        ...item,
        created_at: createdAt,
      });
    } else {
      const existing = map.get(key);
      const existingTime = existing.created_at ? new Date(existing.created_at).getTime() : 0;
      const currentTime = new Date(createdAt).getTime();
      if (currentTime >= existingTime) {
        map.set(key, {
          ...existing,
          ...item,
          created_at: createdAt,
        });
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeA - timeB;
  });
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateLabel = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const today = startOfDay(new Date());
  const targetDay = startOfDay(date);
  const diffTime = today.getTime() - targetDay.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ChatWindow({
  roomName,
  contactName,
  contactId,
  responseTime,
  rating,
  reviewCount,
  onMessageUpdate,
  heightClass = "max-h-[70vh]",
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const justSwitchedRoomRef = useRef(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const { user } = useAuthStore();

  const handleNotifyParent = (message) => {
    if (typeof onMessageUpdate === "function" && message) {
      onMessageUpdate(roomName, message);
    }
  };

  // Scroll ONLY the messages container
  const scrollMessagesToBottom = (smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    } catch {
      // fallback for older browsers
      el.scrollTop = el.scrollHeight;
    }
  };

  // Ensure we really hit the bottom after DOM updates
  const ensureScrollBottom = (smooth = true) => {
    scrollMessagesToBottom(smooth);
    try {
      requestAnimationFrame(() => scrollMessagesToBottom(smooth));
    } catch {}
    setTimeout(() => scrollMessagesToBottom(smooth), 80);
  };

  // (Disabled auto page scroll)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages from API
  useEffect(() => {
    if (!roomName) {
      setMessages([]);
      return;
    }

    justSwitchedRoomRef.current = true;
    setIsOverlayVisible(true);
    setMessages([]);

    const loadMessages = async () => {
      try {
        const data = await chatService.getMessages(roomName);
        const normalized = normalizeMessages(Array.isArray(data) ? data : []);
        setMessages(normalized);

        if (normalized.length > 0) {
          handleNotifyParent(normalized[normalized.length - 1]);
        }

        // Keep without visible scroll animation; overlay will mask until jump done
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [roomName]);

  // After messages render on a room switch, jump instantly to the bottom (no animation)
  useLayoutEffect(() => {
    if (!justSwitchedRoomRef.current) return;
    const el = messagesContainerRef.current;
    if (!el) return;
    setTimeout(() => {
      el.scrollTop = el.scrollHeight;
      try {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      } catch {}
      justSwitchedRoomRef.current = false;
      // Hide overlay shortly after ensuring we are at bottom
      setTimeout(() => setIsOverlayVisible(false), 50);
    }, 500);
  }, [messages]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!roomName) return;

    const handleMessage = (data) => {
      if (data.type === "chat.message") {
        const incoming = {
          id: data.message_id ?? null,
          room: roomName,
          content: data.message,
          sender: data.sender,
          created_at: data.created_at || new Date().toISOString(),
        };

        setMessages((prev) => {
          const normalized = normalizeMessages([...prev, incoming]);
          return normalized;
        });

        handleNotifyParent(incoming);
        // Auto-scroll on new message (container only)
        ensureScrollBottom(true);
      } else if (data.type === "typing") {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleConnected = () => {
      console.log("Connected to chat");
    };

    const handleDisconnected = () => {
      console.log("Disconnected from chat");
    };

    const handleError = (error) => {
      console.error("WebSocket error:", error);
    };

    websocketService.on("message", handleMessage);
    websocketService.on("connected", handleConnected);
    websocketService.on("disconnected", handleDisconnected);
    websocketService.on("error", handleError);

    websocketService.connect(roomName);

    return () => {
      websocketService.off("message", handleMessage);
      websocketService.off("connected", handleConnected);
      websocketService.off("disconnected", handleDisconnected);
      websocketService.off("error", handleError);
    };
  }, [roomName]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !websocketService.isConnected()) return;

    websocketService.sendMessage(newMessage.trim());
    setNewMessage("");
    // Auto-scroll on send (container only)
    setTimeout(() => ensureScrollBottom(true), 0);
  };

  const handleTyping = () => {
    if (websocketService.isConnected()) {
      websocketService.sendTyping();
    }
  };

  if (!roomName) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <p className="text-gray-500">Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-white">
      {/* Overlay to mask initial scroll on room switch */}
      {isOverlayVisible && (
        <div className="absolute inset-0 bg-white z-20 pointer-events-none" />
      )}
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">{contactName?.[0]?.toUpperCase() || "U"}</div>
          <div>
            <h2 className="font-semibold text-gray-900">{contactName || "Unknown"}</h2>
            {user?.role === "guide" ? (
              <p className="text-sm text-gray-500">Nationality: American</p>
            ) : (
              responseTime && (
                <p className="text-sm text-gray-500">Response time: {responseTime}</p>
              )
            )}
          </div>
        </div>
        {user?.role !== "guide" && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
              {[4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 text-gray-300" />
              ))}
            </div>
            <span className="text-xs text-gray-600">0</span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 min-h-0 overflow-y-auto p-4 space-y-3 ${heightClass}`}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          (() => {
            const rendered = [];
            let lastDateLabel = null;

            messages.forEach((message, index) => {
              const dateLabel = formatDateLabel(message.created_at);
              const showDateLabel = dateLabel && dateLabel !== lastDateLabel;

              if (showDateLabel) {
                lastDateLabel = dateLabel;
                rendered.push(
                  <div
                    key={`date-${dateLabel}-${index}`}
                    className="flex items-center gap-3 my-6 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    <div className="flex-1 h-px bg-gray-200" />
                    <span>{dateLabel}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                );
              }

              const userId = user?.id;
              const senderId = message?.sender?.id;
              const currentUsername = user?.username;
              const senderUsername = message?.sender?.username;
              const isOwnMessage =
                (userId != null && senderId != null && String(senderId) === String(userId)) ||
                (!!currentUsername && !!senderUsername && senderUsername === currentUsername);
              const senderName = senderUsername || "Unknown";
              const senderInitial = senderName[0]?.toUpperCase() || "?";

              rendered.push(
                <div
                  key={`${message.id ?? "tmp"}-${message.created_at}`}
                  className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  {!isOwnMessage && (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                      {senderInitial}
                    </div>
                  )}

                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-900 rounded-bl-none"
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold mb-1 opacity-75">
                        {senderName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? "opacity-75" : "text-gray-500"}`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {isOwnMessage && (
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {user?.username?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              );
            });

            return rendered;
          })()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message here"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !websocketService.isConnected()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

