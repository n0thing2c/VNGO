import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Send, Star } from "lucide-react";
import { websocketService } from "@/services/websocketService";
import { chatService } from "@/services/chatService";
import { tourService } from "@/services/tourService";
import { useAuthStore } from "../../../stores/useAuthStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

const enrichMessageWithAvatars = (
  message,
  {
    userId,
    userUsername,
    userAvatar,
    contactId,
    contactName,
    contactAvatar,
  }
) => {
  if (!message) return message;

  const sender = {
    ...(message.sender || {}),
  };

  const normalize = (value) => (value ?? "").toString().trim().toLowerCase();

  const isOwnMessage =
    (!!sender.id && !!userId && String(sender.id) === String(userId)) ||
    (!!sender.username && !!userUsername && normalize(sender.username) === normalize(userUsername));

  const isContactMessage =
    (!!sender.id && !!contactId && String(sender.id) === String(contactId)) ||
    (!!sender.username && !!contactName && normalize(sender.username) === normalize(contactName));

  if (!sender.avatar) {
    if (isOwnMessage && userAvatar) {
      sender.avatar = userAvatar;
    } else if (isContactMessage && contactAvatar) {
      sender.avatar = contactAvatar;
    }
  }

  return {
    ...message,
    sender,
  };
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
  const userAvatar = user?.avatar || user?.avatar_url;

  const enrichSender = useCallback(
    (message) =>
      enrichMessageWithAvatars(message, {
        userId: user?.id,
        userUsername: user?.username,
        userAvatar,
        contactId,
        contactName,
        contactAvatar,
      }),
    [user?.id, user?.username, userAvatar, contactId, contactName, contactAvatar]
  );

  useEffect(() => {
    if (contactName === " chatbot") return;
    if (!contactId || user?.role === "guide") return;

    const fetchGuideRating = async () => {
      setAverageRating(0);
      setTotalReviews(0);
      if (contactName !== "chatbot") {
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
    } catch { }
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
        const normalized = normalizeMessages(Array.isArray(data) ? data : []).map(enrichSender);
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
  }, [roomName, enrichSender]);

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
      } catch { }
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

        const enrichedIncoming = enrichSender(incoming);

        setMessages((prev) => {
          // 1. If incoming is from chatbot, remove the "Thinking..." placeholder
          let newMessages = [...prev];
          if (incoming.sender?.username === "chatbot") {
            newMessages = newMessages.filter(m => !m.isLoading);
          }

          // 2. If incoming is from me (echo), we don't need to do anything special 
          // because we are NOT adding a temp message for the user anymore.

          const normalized = normalizeMessages([...newMessages, enrichedIncoming]).map(enrichSender);
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
  }, [roomName, user?.id, enrichSender]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    // Only block when WebSocket connection is lost
    if (!websocketService.isConnected()) return;
    // NEW LOGIC:
    // If newMessage has content after trim() -> Keep it.
    // If empty -> Assign icon "👍".
    const messageToSend = newMessage.trim() || "👍";

    // --- OPTIMISTIC UI ---
    if (roomName.endsWith("chatbot")) {
      const tempBotMsg = {
        id: `temp-bot-${Date.now()}`,
        room: roomName,
        content: "Looking up available tours...",
        sender: { username: "chatbot", id: "chatbot" },
        created_at: new Date(Date.now() + 100).toISOString(), // slightly after
        isTemp: true,
        isLoading: true
      };

      setMessages(prev => [...prev, tempBotMsg]);
      setTimeout(() => ensureScrollBottom(true), 0);
    }

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
          {roomName.endsWith("chatbot") ?
            (<div className="p-3 text-black rounded-full bg-gray-300 flex items-center justify-center group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 122.88 119.35"
                className="w-8 h-8 fill-current"
              >
                <path d="M57.49,29.2V23.53a14.41,14.41,0,0,1-2-.93A12.18,12.18,0,0,1,50.44,7.5a12.39,12.39,0,0,1,2.64-3.95A12.21,12.21,0,0,1,57,.92,12,12,0,0,1,61.66,0,12.14,12.14,0,0,1,72.88,7.5a12.14,12.14,0,0,1,0,9.27,12.08,12.08,0,0,1-2.64,3.94l-.06.06a12.74,12.74,0,0,1-2.36,1.83,11.26,11.26,0,0,1-2,.93V29.2H94.3a15.47,15.47,0,0,1,15.42,15.43v2.29H115a7.93,7.93,0,0,1,7.9,7.91V73.2A7.93,7.93,0,0,1,115,81.11h-5.25v2.07A15.48,15.48,0,0,1,94.3,98.61H55.23L31.81,118.72a2.58,2.58,0,0,1-3.65-.29,2.63,2.63,0,0,1-.63-1.85l1.25-18h-.21A15.45,15.45,0,0,1,13.16,83.18V81.11H7.91A7.93,7.93,0,0,1,0,73.2V54.83a7.93,7.93,0,0,1,7.9-7.91h5.26v-2.3A15.45,15.45,0,0,1,28.57,29.2H57.49ZM82.74,47.32a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm-42.58,0a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm6.38,31.36a2.28,2.28,0,0,1-.38-.38,2.18,2.18,0,0,1-.52-1.36,2.21,2.21,0,0,1,.46-1.39,2.4,2.4,0,0,1,.39-.39,3.22,3.22,0,0,1,3.88-.08A22.36,22.36,0,0,0,56,78.32a14.86,14.86,0,0,0,5.47,1A16.18,16.18,0,0,0,67,78.22,25.39,25.39,0,0,0,72.75,75a3.24,3.24,0,0,1,3.89.18,3,3,0,0,1,.37.41,2.22,2.22,0,0,1,.42,1.4,2.33,2.33,0,0,1-.58,1.35,2.29,2.29,0,0,1-.43.38,30.59,30.59,0,0,1-7.33,4,22.28,22.28,0,0,1-7.53,1.43A21.22,21.22,0,0,1,54,82.87a27.78,27.78,0,0,1-7.41-4.16l0,0ZM94.29,34.4H28.57A10.26,10.26,0,0,0,18.35,44.63V83.18A10.26,10.26,0,0,0,28.57,93.41h3.17a2.61,2.61,0,0,1,2.41,2.77l-1,14.58L52.45,94.15a2.56,2.56,0,0,1,1.83-.75h40a10.26,10.26,0,0,0,10.22-10.23V44.62A10.24,10.24,0,0,0,94.29,34.4Z" />
              </svg>
            </div>) :
            (contactAvatar ? (
              <img
                src={contactAvatar}
                alt={contactName}
                className="h-10 w-10 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                {contactName?.[0]?.toUpperCase() || "U"}
              </div>
            ))}
          <div>
            <h2 className="font-semibold text-gray-900">{contactName || "Unknown"}</h2>
            {contactName === "chatbot" ? (
              <p className="text-sm text-gray-500">Tell Me Your Dream Trip — I’ll Find It</p>
            )
              : (user?.role === "guide" ? (
                <p className="text-sm text-gray-500">Nationality: American</p>
              ) : (
                responseTime && (
                  <p className="text-sm text-gray-500">Response time: {responseTime}</p>
                )
              ))}
          </div>
        </div>
        {(user?.role !== "guide" && contactName !== "chatbot") && (
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
                    roomName.endsWith("chatbot") ?
                      (<div className=" h-8 w-8 p-1 text-black rounded-full bg-gray-300 flex items-center justify-center group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 122.88 119.35"
                          className="w-8 h-8 fill-current"
                        >
                          <path d="M57.49,29.2V23.53a14.41,14.41,0,0,1-2-.93A12.18,12.18,0,0,1,50.44,7.5a12.39,12.39,0,0,1,2.64-3.95A12.21,12.21,0,0,1,57,.92,12,12,0,0,1,61.66,0,12.14,12.14,0,0,1,72.88,7.5a12.14,12.14,0,0,1,0,9.27,12.08,12.08,0,0,1-2.64,3.94l-.06.06a12.74,12.74,0,0,1-2.36,1.83,11.26,11.26,0,0,1-2,.93V29.2H94.3a15.47,15.47,0,0,1,15.42,15.43v2.29H115a7.93,7.93,0,0,1,7.9,7.91V73.2A7.93,7.93,0,0,1,115,81.11h-5.25v2.07A15.48,15.48,0,0,1,94.3,98.61H55.23L31.81,118.72a2.58,2.58,0,0,1-3.65-.29,2.63,2.63,0,0,1-.63-1.85l1.25-18h-.21A15.45,15.45,0,0,1,13.16,83.18V81.11H7.91A7.93,7.93,0,0,1,0,73.2V54.83a7.93,7.93,0,0,1,7.9-7.91h5.26v-2.3A15.45,15.45,0,0,1,28.57,29.2H57.49ZM82.74,47.32a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm-42.58,0a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm6.38,31.36a2.28,2.28,0,0,1-.38-.38,2.18,2.18,0,0,1-.52-1.36,2.21,2.21,0,0,1,.46-1.39,2.4,2.4,0,0,1,.39-.39,3.22,3.22,0,0,1,3.88-.08A22.36,22.36,0,0,0,56,78.32a14.86,14.86,0,0,0,5.47,1A16.18,16.18,0,0,0,67,78.22,25.39,25.39,0,0,0,72.75,75a3.24,3.24,0,0,1,3.89.18,3,3,0,0,1,.37.41,2.22,2.22,0,0,1,.42,1.4,2.33,2.33,0,0,1-.58,1.35,2.29,2.29,0,0,1-.43.38,30.59,30.59,0,0,1-7.33,4,22.28,22.28,0,0,1-7.53,1.43A21.22,21.22,0,0,1,54,82.87a27.78,27.78,0,0,1-7.41-4.16l0,0ZM94.29,34.4H28.57A10.26,10.26,0,0,0,18.35,44.63V83.18A10.26,10.26,0,0,0,28.57,93.41h3.17a2.61,2.61,0,0,1,2.41,2.77l-1,14.58L52.45,94.15a2.56,2.56,0,0,1,1.83-.75h40a10.26,10.26,0,0,0,10.22-10.23V44.62A10.24,10.24,0,0,0,94.29,34.4Z" />
                        </svg>
                      </div>)
                      : (senderAvatar ? (
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
                      ))}

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
                    <div className="text-sm break-words">
                      {roomName.endsWith("chatbot") && !isOwnMessage ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, ...props }) => (
                              <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />
                            ),
                            p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                            ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-4 mb-2" />,
                            ol: ({ node, ...props }) => <ol {...props} className="list-decimal ml-4 mb-2" />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isOwnMessage ? "opacity-75" : "text-gray-500"}`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {isOwnMessage && (
                    (senderAvatar || userAvatar) ? (
                      <img
                        src={senderAvatar || userAvatar}
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

