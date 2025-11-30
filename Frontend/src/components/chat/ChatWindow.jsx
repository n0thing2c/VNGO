import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { websocketService } from "@/services/websocketService";
import { chatService } from "@/services/chatService";
import { tourService } from "@/services/tourService";
import { useAuthStore } from "../../../stores/useAuthStore";
import ChatInput from "./ChatInput";
import MessagesList from "./MessagesList";

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
  contactNationality,
  responseTime,
  onMessageUpdate,
  heightClass = "max-h-[70vh]",
}) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isContactOnline, setIsContactOnline] = useState(false);
  const [contactSeenAt, setContactSeenAt] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const justSwitchedRoomRef = useRef(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const typingTimeoutRef = useRef(null);
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
    // Skip for chatbot (case-insensitive check)
    const isChatbot = contactName?.toLowerCase().trim() === "chatbot" || 
                      contactId === "chatbot" || 
                      roomName?.endsWith("chatbot");
    if (isChatbot) return;
    
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
  }, [contactId, contactName, user?.role, roomName]);

  // Fetch and poll online status for contact
  useEffect(() => {
    const isChatbot = contactName?.toLowerCase().trim() === "chatbot" || 
                      contactId === "chatbot" || 
                      roomName?.endsWith("chatbot");
    if (isChatbot) {
      setIsContactOnline(false);
      return;
    }

    const fetchOnlineStatus = async () => {
      // If we have contactId, use it
      if (contactId) {
        const status = await chatService.getUserOnlineStatus(contactId);
        setIsContactOnline(status.is_online);
        return;
      }
      
      // If no contactId, try to parse username from roomName
      // Room name format: username1__username2
      if (roomName && roomName.includes("__")) {
        const parts = roomName.split("__");
        const currentUsername = user?.username?.toLowerCase();
        const otherUsername = parts.find(
          (part) => part && part.toLowerCase() !== currentUsername
        );
        
        if (otherUsername) {
          const status = await chatService.getUserOnlineStatusByUsername(otherUsername);
          setIsContactOnline(status.is_online);
          return;
        }
      }
      
      setIsContactOnline(false);
    };

    // Fetch immediately
    fetchOnlineStatus();

    // Poll every 5 seconds to keep status updated
    const intervalId = setInterval(fetchOnlineStatus, 5000);

    return () => clearInterval(intervalId);
  }, [contactId, contactName, roomName, user?.username]);

  // Fetch initial seen status for room
  useEffect(() => {
    const isChatbot = contactName?.toLowerCase().trim() === "chatbot" || 
                      contactId === "chatbot" || 
                      roomName?.endsWith("chatbot");
    if (isChatbot || !roomName) {
      setContactSeenAt(null);
      return;
    }

    const fetchSeenStatus = async () => {
      const status = await chatService.getRoomSeenStatus(roomName);
      setContactSeenAt(status.contact_seen_at);
    };

    fetchSeenStatus();
  }, [roomName, contactId, contactName]);

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

        // Mark room as seen when receiving a message (user is actively viewing)
        // This ensures hasUnread stays false while user is in the room
        const isFromOther = incoming.sender?.id && String(incoming.sender.id) !== String(user?.id);
        if (isFromOther) {
          websocketService.sendMarkSeen();
        }

        handleNotifyParent(incoming);
        // Auto-scroll on new message (container only)
        ensureScrollBottom(true);
      } else if (data.type === "typing") {
        // Backend sends typing event with user_id, not sender object
        const typingUserId = data.user_id;
        const currentUserId = user?.id;
        
        // Only show typing indicator if it's from the other person, not from current user
        const isFromCurrentUser = currentUserId && typingUserId && String(typingUserId) === String(currentUserId);
        
        if (!isFromCurrentUser) {
          setIsTyping(true);
          // Clear existing timeout if any
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          // Set new timeout to hide typing indicator after 3 seconds
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            typingTimeoutRef.current = null;
          }, 3000);
        }
      } else if (data.type === "user_status") {
        // Handle user online/offline status updates
        const statusUserId = data.user_id;
        if (contactId && String(statusUserId) === String(contactId)) {
          setIsContactOnline(data.is_online);
        }
      } else if (data.type === "message_seen") {
        // Handle message seen updates
        const seenUserId = data.user_id;
        const currentUserId = user?.id;
        // Only update if it's from the other person (contact), not from current user
        if (currentUserId && seenUserId && String(seenUserId) !== String(currentUserId)) {
          setContactSeenAt(data.seen_at);
        }
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
      // Clear typing timeout on cleanup
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [roomName, user?.id, enrichSender]);

  const handleSendMessage = useCallback((messageToSend) => {
    // Only block when WebSocket connection is lost
    if (!websocketService.isConnected()) return;

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

    // Auto-scroll on send
    setTimeout(() => ensureScrollBottom(true), 0);
  }, [roomName]);

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
            (<div className="relative">
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
              {/* Online status indicator */}
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  isContactOnline ? "bg-green-500" : "bg-gray-400"
                }`}
                title={isContactOnline ? "Online" : "Offline"}
              />
            </div>)}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">{contactName || "Unknown"}</h2>
              {!(contactName?.toLowerCase().trim() === "chatbot" || contactId === "chatbot" || roomName?.endsWith("chatbot")) && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isContactOnline 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {isContactOnline ? "Online" : "Offline"}
                </span>
              )}
            </div>
            {(contactName?.toLowerCase().trim() === "chatbot" || contactId === "chatbot" || roomName?.endsWith("chatbot")) ? (
              <p className="text-sm text-gray-500">Tell Me Your Dream Trip — I'll Find It</p>
            )
              : (user?.role === "guide" ? (
                <p className="text-sm text-gray-500">
                  Nationality: {contactNationality || "Unknown"}
                </p>
              ) : (
                responseTime && (
                  <p className="text-sm text-gray-500">Response time: {responseTime}</p>
                )
              ))}
          </div>
        </div>
        {(user?.role !== "guide" && 
          contactName?.toLowerCase().trim() !== "chatbot" && 
          contactId !== "chatbot" && 
          !roomName?.endsWith("chatbot")) && (
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
        <MessagesList
          messages={messages}
          user={user}
          roomName={roomName}
          userAvatar={userAvatar}
          isTyping={isTyping}
          contactName={contactName}
          contactAvatar={contactAvatar}
          isContactOnline={isContactOnline}
          contactSeenAt={contactSeenAt}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!websocketService.isConnected()}
      />
    </div>
  );
}

