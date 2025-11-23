import { useState, useEffect, useMemo, useCallback } from "react";
import MessageList from "@/components/chat/MessageList";
import ChatWindow from "@/components/chat/ChatWindow";
import { chatService } from "@/services/chatService";
import { useAuthStore } from "../../stores/useAuthStore";
import { notificationService } from "@/services/notifyService";
import { useLocation } from "react-router-dom";

const normalizeConversations = (items) => {
  const map = new Map();

  items.forEach((item) => {
    if (!item || !item.room) {
      return;
    }

    const existing = map.get(item.room);
    const currentTime = item.lastMessageTime
      ? new Date(item.lastMessageTime).getTime()
      : 0;
    const existingTime =
      existing && existing.lastMessageTime
        ? new Date(existing.lastMessageTime).getTime()
        : 0;

    if (!existing || currentTime >= existingTime) {
      map.set(item.room, {
        ...existing,
        ...item,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA;
  });
};

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const { user, refreshUser, accessToken } = useAuthStore();
  const location = useLocation();
  const targetRoom = location.state?.targetRoom;
  const targetUser = location.state?.targetUser;

  const resolveRoomMateName = useCallback(
    (roomName) => {
      if (!roomName?.includes("__")) return null;
      const parts = roomName.split("__").filter(Boolean);
      if (parts.length === 0) return null;
      if (!user?.username) {
        return parts.join(" & ");
      }
      const lowerCurrent = user.username.toLowerCase();
      const partner = parts.find(
        (name) => name && name.toLowerCase() !== lowerCurrent
      );
      return partner || parts[0];
    },
    [user?.username]
  );

  // Ensure user data is loaded if we have a token but no user (fixes "first load" issue)
  useEffect(() => {
    if (accessToken && !user) {
      refreshUser();
    }
  }, [accessToken, user, refreshUser]);

  const withDisplayName = useCallback(
    (conversation) => {
      if (!conversation) return conversation;
      
      // Always prioritize parsing from room name to ensure getting the correct recipient
      const parsedName = resolveRoomMateName(conversation.room);
      
      if (parsedName) {
        return {
          ...conversation,
          contactName: parsedName,
        };
      }
      
      // If parsing from room name fails, then use contactName from backend
      const hasCustomName =
        conversation.contactName &&
        !conversation.contactName.toLowerCase().startsWith("room:");
      
      if (hasCustomName) {
        return {
          ...conversation,
          contactName: conversation.contactName.trim(),
        };
      }
      
      const stripped =
        conversation.contactName?.replace(/^Room:\s*/i, "").trim() || "";
      return {
        ...conversation,
        contactName: stripped || "Unknown contact",
      };
    },
    [resolveRoomMateName]
  );

  const normalizeAndEnhance = useCallback(
    (items) => normalizeConversations(items).map(withDisplayName),
    [withDisplayName]
  );

  const handleConversationUpdate = useCallback(
    (roomName, message) => {
      if (!roomName) return;

      setConversations((prev) => {
        const existing = prev.find((c) => c.room === roomName);

        // Always prioritize parsing from room name to find partner (recipient)
        const parsedPartnerName = resolveRoomMateName(roomName);
        
        // If there is a message from another person (not the current user), use their username
        // Otherwise, use parsed name from room, or fallback to existing
        let otherUserName = parsedPartnerName;
        if (message?.sender && message.sender.id !== user?.id) {
          otherUserName = message.sender.username || parsedPartnerName || existing?.contactName || "Unknown contact";
        } else if (!parsedPartnerName) {
          otherUserName = existing?.contactName || "Unknown contact";
        }

        const otherUserId =
          message?.sender && message.sender.id !== user?.id
            ? String(message.sender.id)
            : existing?.contactId || roomName;

        const updatedConversation = {
          room: roomName,
          contactName: otherUserName,
          contactId: otherUserId,
          lastMessage:
            message?.content || existing?.lastMessage || "No message yet",
          lastMessageTime:
            message?.created_at || existing?.lastMessageTime || null,
          responseTime: existing?.responseTime || "30 minutes",
          rating: existing?.rating ?? 3.5,
          reviewCount: existing?.reviewCount ?? 0,
        };

        const filtered = prev.filter((c) => c.room !== roomName);
        const normalized = normalizeAndEnhance([
          ...filtered,
          updatedConversation,
        ]);

        if (selectedRoom === roomName) {
          const found = normalized.find((c) => c.room === roomName);
          if (found) {
            setSelectedContact(found);
          }
        }

        return normalized;
      });
    },
    [normalizeAndEnhance, selectedRoom, user?.id, resolveRoomMateName]
  );

  // Load conversations from API when component mounts
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await chatService.getConversations();
        const normalized = normalizeAndEnhance(data || []);
        setConversations(normalized);

        // Auto-select first conversation if available and no room is selected
        if (normalized.length > 0 && !selectedRoom) {
          setSelectedRoom(normalized[0].room);
          setSelectedContact(normalized[0]);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
      }
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic refresh to reflect messages from other rooms
  useEffect(() => {
    let isCancelled = false;
    const tick = async () => {
      try {
        const data = await chatService.getConversations();
        if (isCancelled) return;
        const normalized = normalizeAndEnhance(data || []);
        setConversations((prev) => {
          // Merge keeping latest info and order
          const merged = normalizeAndEnhance([...prev, ...normalized]);
          return merged;
        });
      } catch {}
    };

    const id = setInterval(tick, 5000); // 5s refresh
    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, []);

  // Realtime notifications for other rooms
  useEffect(() => {
    const handle = (data) => {
      if (!data || !data.room) return;
      const message = {
        content: data.message,
        created_at: data.created_at || new Date().toISOString(),
        sender: data.sender || null,
      };
      handleConversationUpdate(data.room, message);
    };

    notificationService.on("notification", handle);
    notificationService.connect();
    return () => {
      notificationService.off("notification", handle);
    };
  }, [handleConversationUpdate]);

  const normalizedConversations = useMemo(
    () => normalizeAndEnhance(conversations),
    [conversations, normalizeAndEnhance]
  );

  const filteredConversations = normalizedConversations.filter(
    (conv) =>
      conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contactId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRoom = (roomName) => {
    setSelectedRoom(roomName);
    const contact = normalizedConversations.find((c) => c.room === roomName);
    setSelectedContact(contact || null);
  };

  useEffect(() => {
    if (!targetRoom) return;

    const contactName =
      targetUser?.name?.trim() ||
      targetUser?.username ||
      "Unknown contact";
    const contactId =
      targetUser?.id != null
        ? String(targetUser.id)
        : targetUser?.username || targetRoom;

    setSelectedRoom(targetRoom);
    setConversations((prev) => {
      const existing = prev.find((c) => c.room === targetRoom);
      const updatedConversation = {
        room: targetRoom,
        contactName,
        contactId,
        lastMessage: existing?.lastMessage || "No message yet",
        lastMessageTime: existing?.lastMessageTime || null,
        responseTime: existing?.responseTime || "30 minutes",
        rating: existing?.rating ?? 3.5,
        reviewCount: existing?.reviewCount ?? 0,
      };
      const filtered = prev.filter((c) => c.room !== targetRoom);
      const normalized = normalizeAndEnhance([
        ...filtered,
        updatedConversation,
      ]);
      const found = normalized.find((c) => c.room === targetRoom);
      setSelectedContact(found || updatedConversation);
      return normalized;
    });
  }, [targetRoom, targetUser]);

  return (
    <div>
      {/* Main Content */}
      <div className="flex px-[1%] py-[1%] gap-4 bg-gray-200" >
        {/* Left Sidebar - Messages List */}
        <div className="w-[17%] rounded-2xl bg-white">
          <MessageList
            conversations={filteredConversations}
            selectedRoom={selectedRoom}
            onSelectRoom={handleSelectRoom}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            heightClass="max-h-[67vh]"
          />
        </div>

        {/* Right Side - Chat Window */}
        <div className="flex-1 rounded-2xl overflow-hidden bg-white">
          {selectedContact ? (
            <ChatWindow
              roomName={selectedRoom}
              contactName={selectedContact.contactName}
              contactId={selectedContact.contactId}
              responseTime={selectedContact.responseTime}
              rating={selectedContact.rating}
              reviewCount={selectedContact.reviewCount}
              onMessageUpdate={handleConversationUpdate}
              heightClass="min-h-[62vh] max-h-[62vh]"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[79vh]">
              <p className="text-gray-500">
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
