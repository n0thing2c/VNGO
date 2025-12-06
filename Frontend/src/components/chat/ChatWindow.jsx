import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Star, Phone, Video } from "lucide-react";
import { websocketService } from "@/services/websocketService";
import { chatService } from "@/services/chatService";
import { tourService } from "@/services/tourService";
import { useAuthStore } from "@/stores/useAuthStore";
import ChatInput from "./ChatInput";
import MessagesList from "./MessagesList";
import { useCall } from "@/components/call/CallProvider";
import { Button } from "@/components/ui/button";

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
  contactIsOnline: contactIsOnlineProp,
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
  
  // Call functionality
  const { callUser, isInCall } = useCall();

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
      
      // Fetch reviews from guide like in guide-public-profile
      const res = await tourService.getAllTourRatingsByGuide(contactId);
      if (res.success && Array.isArray(res.data)) {
        const reviews = res.data;
        if (reviews.length > 0) {
          // Calculate average rating from reviews
          const totalRating = reviews.reduce(
            (acc, review) => acc + (parseFloat(review.rating) || 0),
            0
          );
          const avg = totalRating / reviews.length;

          setAverageRating(avg);
          setTotalReviews(reviews.length);
        }
      }
    };

    fetchGuideRating();
  }, [contactId, contactName, user?.role, roomName]);

  // Sync online status from parent prop (conversation list already polls this)
  // Also fetch directly if contactId is missing (new room where other user hasn't replied yet)
  useEffect(() => {
    const isChatbot = contactName?.toLowerCase().trim() === "chatbot" || 
                      contactId === "chatbot" || 
                      roomName?.endsWith("chatbot");
    if (isChatbot) {
      setIsContactOnline(false);
      return;
    }

    // If we have contactIsOnlineProp from parent, use it
    if (contactIsOnlineProp !== undefined && contactId) {
      setIsContactOnline(contactIsOnlineProp);
      return;
    }

    // If contactId is missing but we have contactName, fetch online status by username
    // This handles the case where A sends to B but B hasn't replied yet
    const fetchOnlineStatusByUsername = async () => {
      if (!contactName) return;
      
      try {
        const status = await chatService.getUserOnlineStatusByUsername(contactName);
        if (status && status.is_online !== undefined) {
          setIsContactOnline(status.is_online);
        }
      } catch (error) {
        console.error("Error fetching online status by username:", error);
      }
    };

    if (!contactId && contactName) {
      fetchOnlineStatusByUsername();
      // Set up polling interval for online status when contactId is missing
      const interval = setInterval(fetchOnlineStatusByUsername, 10000); // every 10s
      return () => clearInterval(interval);
    }
  }, [contactId, contactName, roomName, contactIsOnlineProp]);

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
          let newMessages = [...prev];
          
          // 1. If incoming is from chatbot, remove the "Thinking..." placeholder
          if (incoming.sender?.username === "chatbot") {
            newMessages = newMessages.filter(m => !m.isLoading);
          }

          // 2. If incoming is from me (echo), replace temp message with real one
          const isFromMe = incoming.sender?.id && String(incoming.sender.id) === String(user?.id);
          if (isFromMe) {
            // Find and remove matching temp message (same content from same user)
            newMessages = newMessages.filter(m => {
              if (!m.isTemp) return true;
              // Remove temp if content matches
              return m.content !== incoming.content;
            });
          }

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
      // Mark room as seen after connecting (user is viewing this room)
      // Small delay to avoid race conditions during hot reload
      setTimeout(() => {
        if (websocketService.isConnected()) {
          websocketService.sendMarkSeen();
        }
      }, 500);
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

    const now = new Date();
    const tempId = `temp-user-${Date.now()}`;

    // --- OPTIMISTIC UI: Show user's message immediately ---
    const tempUserMsg = {
      id: tempId,
      room: roomName,
      content: messageToSend,
      sender: {
        id: user?.id,
        username: user?.username,
        avatar: userAvatar,
      },
      created_at: now.toISOString(),
      isTemp: true,
    };

    if (roomName.endsWith("chatbot")) {
      // For chatbot: show user message + bot "thinking" placeholder
      const tempBotMsg = {
        id: `temp-bot-${Date.now()}`,
        room: roomName,
        content: "Looking up available tours...",
        sender: { username: "chatbot", id: "chatbot" },
        created_at: new Date(now.getTime() + 100).toISOString(), // slightly after
        isTemp: true,
        isLoading: true
      };

      setMessages(prev => [...prev, tempUserMsg, tempBotMsg]);
    } else {
      // For normal chat: just show user message immediately
      setMessages(prev => [...prev, tempUserMsg]);
    }

    setTimeout(() => ensureScrollBottom(true), 0);

    websocketService.sendMessage(messageToSend);
  }, [roomName, user?.id, user?.username, userAvatar]);

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
            (<div className="h-10 w-10 text-[#020765] rounded-full bg-gradient-to-r from-[#020765]/10 to-[#23c491]/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                {/* Robot head */}
                <rect x="4" y="6" width="16" height="12" rx="2" />
                {/* Antenna */}
                <line x1="12" y1="6" x2="12" y2="2" />
                <circle cx="12" cy="2" r="1" fill="currentColor" />
                {/* Eyes */}
                <circle cx="9" cy="11" r="1.5" fill="currentColor" />
                <circle cx="15" cy="11" r="1.5" fill="currentColor" />
                {/* Mouth */}
                <path d="M9 15h6" />
                {/* Ears */}
                <rect x="1" y="10" width="2" height="4" rx="0.5" fill="currentColor" />
                <rect x="21" y="10" width="2" height="4" rx="0.5" fill="currentColor" />
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
            <div className="flex items-center gap-2 flex-wrap">
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
              {/* Rating display next to name (for tourists viewing guides) */}
              {(user?.role !== "guide" && 
                contactName?.toLowerCase().trim() !== "chatbot" && 
                contactId !== "chatbot" && 
                !roomName?.endsWith("chatbot")) && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= Math.round(averageRating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                          }`}
                        fill="currentColor"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">({totalReviews})</span>
                </div>
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
        {/* Call buttons - hide for chatbot */}
        {!(contactName?.toLowerCase().trim() === "chatbot" || 
           contactId === "chatbot" || 
           roomName?.endsWith("chatbot")) && (
          <div className="flex items-center gap-2">
            {/* Audio Call Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => callUser(contactId, contactName, false)}
              disabled={isInCall || !isContactOnline}
              className="h-9 w-9 rounded-full hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
              title={!isContactOnline ? "User is offline" : "Voice Call"}
            >
              <Phone className="h-5 w-5" />
            </Button>
            
            {/* Video Call Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => callUser(contactId, contactName, true)}
              disabled={isInCall || !isContactOnline}
              className="h-9 w-9 rounded-full hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
              title={!isContactOnline ? "User is offline" : "Video Call"}
            >
              <Video className="h-5 w-5" />
            </Button>
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

