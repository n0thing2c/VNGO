import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Send, Star } from "lucide-react";
import { websocketService } from "@/services/websocketService";
import { chatService } from "@/services/chatService";
import { tourService } from "@/services/tourService";
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

  return date.toLocaleDateString("en-EN", {
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
  contactAvatar,
  responseTime,
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
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (!contactId || user?.role === "guide") return;

    const fetchGuideRating = async () => {
      setAverageRating(0);
      setTotalReviews(0);

      const res = await tourService.getAllToursByGuide(contactId);
      if (res.success && Array.isArray(res.data)) {
        const tours = res.data;
        if (tours.length > 0) {
          // Calculate average of tour ratings
          const totalRating = tours.reduce(
            (acc, tour) => acc + (parseFloat(tour.rating) || 0),
            0
          );
          const avg = totalRating / tours.length;

          // Calculate total reviews across all tours
          const totalRev = tours.reduce(
            (acc, tour) => acc + (parseInt(tour.reviews) || 0),
            0
          );

          setAverageRating(avg);
          setTotalReviews(totalRev);
        }
      }
    };

    fetchGuideRating();
  }, [contactId, user?.role]);

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
    // Only block when WebSocket connection is lost
    if (!websocketService.isConnected()) return;
    // NEW LOGIC:
    // If newMessage has content after trim() -> Keep it.
    // If empty -> Assign icon "👍".
    const messageToSend = newMessage.trim() || "👍";
    websocketService.sendMessage(messageToSend);

    setNewMessage(""); // Clear input field

    // Auto-scroll on send
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
      <div className="p-4 border-b-1 border-black rounded-b-3xl  flex items-center justify-between">
        <div className="flex items-center gap-3">
          {contactAvatar ? (
            <img
              src={contactAvatar}
              alt={contactName}
              className="h-10 w-10 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
              {contactName?.[0]?.toUpperCase() || "U"}
            </div>
          )}
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
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                    }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">{totalReviews}</span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 min-h-0 overflow-y-auto p-4 space-y-3 ${heightClass}`}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full py-[15%] text-gray-500">
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

              const senderAvatar = message?.sender?.avatar;

              rendered.push(
                <div
                  key={`${message.id ?? "tmp"}-${message.created_at}`}
                  className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  {!isOwnMessage && (
                    senderAvatar ? (
                      <img
                        src={senderAvatar}
                        alt={senderName}
                        className="h-8 w-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                        {senderInitial}
                      </div>
                    )
                  )}

                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwnMessage
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
                    senderAvatar ? (
                      <img
                        src={senderAvatar}
                        alt={user?.username || "Me"}
                        className="h-8 w-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </div>
                    )
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
      <form onSubmit={handleSendMessage} className="p-4 ">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message here"
            className="flex-1 px-4 py-2 border border-black rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!websocketService.isConnected()}
            className="
                  p-3 rounded-full shrink-0 transition-all duration-200
                  text-blue-600 hover:bg-blue-50 active:scale-95
                  disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed
                "
          >
            {!newMessage.trim() ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" />
              </svg>) :
              (<svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 ml-1"
              >
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>)}
          </button>
        </div>
      </form>
    </div>
  );
}

