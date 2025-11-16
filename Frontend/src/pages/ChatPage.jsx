import { useState, useEffect, useMemo, useCallback } from "react";
import HeaderChat from "@/components/HeaderChat";
import Footer from "@/components/Footer";
import MessageList from "@/components/chat/MessageList";
import ChatWindow from "@/components/chat/ChatWindow";
import { chatService } from "@/services/chatService";
import { useAuthStore } from "../../stores/useAuthStore";
import { Users } from "lucide-react";
import { notificationService } from "@/services/notifyService";

const normalizeConversations = (items) => {
  const map = new Map();

  items.forEach((item) => {
    if (!item || !item.room) {
      return;
    }

    const existing = map.get(item.room);
    const currentTime = item.lastMessageTime ? new Date(item.lastMessageTime).getTime() : 0;
    const existingTime = existing && existing.lastMessageTime ? new Date(existing.lastMessageTime).getTime() : 0;

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
  const [roomInput, setRoomInput] = useState("");
  const { user } = useAuthStore();

  const handleConversationUpdate = useCallback(
    (roomName, message) => {
      if (!roomName) return;

      setConversations((prev) => {
        const existing = prev.find((c) => c.room === roomName);

        const otherUserName =
          message?.sender && message.sender.id !== user?.id
            ? message.sender.username || existing?.contactName || `Room: ${roomName}`
            : existing?.contactName || `Room: ${roomName}`;

        const otherUserId =
          message?.sender && message.sender.id !== user?.id
            ? String(message.sender.id)
            : existing?.contactId || roomName;

        const updatedConversation = {
          room: roomName,
          contactName: otherUserName,
          contactId: otherUserId,
          lastMessage: message?.content || existing?.lastMessage || "No message yet",
          lastMessageTime: message?.created_at || existing?.lastMessageTime || null,
          responseTime: existing?.responseTime || "30 minutes",
          rating: existing?.rating ?? 3.5,
          reviewCount: existing?.reviewCount ?? 0,
        };

        const filtered = prev.filter((c) => c.room !== roomName);
        const normalized = normalizeConversations([...filtered, updatedConversation]);

        if (selectedRoom === roomName) {
          const found = normalized.find((c) => c.room === roomName);
          if (found) {
            setSelectedContact(found);
          }
        }

        return normalized;
      });
    },
    [selectedRoom, user?.id]
  );

  // Load conversations từ API khi component mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await chatService.getConversations();
        const normalized = normalizeConversations(data || []);
        setConversations(normalized);
        
        // Auto-select first conversation nếu có và chưa có room được chọn
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
        const normalized = normalizeConversations(data || []);
        setConversations((prev) => {
          // Merge keeping latest info and order
          const merged = normalizeConversations([...prev, ...normalized]);
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

  const normalizedConversations = useMemo(() => normalizeConversations(conversations), [conversations]);

  const filteredConversations = normalizedConversations.filter((conv) =>
    conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contactId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRoom = (roomName) => {
    setSelectedRoom(roomName);
    const contact = normalizedConversations.find((c) => c.room === roomName);
    setSelectedContact(contact || null);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomInput.trim()) return;
    
    const roomName = roomInput.trim();
    setSelectedRoom(roomName);
    
    const existingConv = normalizedConversations.find((c) => c.room === roomName);
    if (!existingConv) {
      const newConv = {
        room: roomName,
        contactName: `Room: ${roomName}`,
        contactId: roomName,
        lastMessage: "No message yet",
        lastMessageTime: null,
        responseTime: "30 minutes",
        rating: 3.5,
        reviewCount: 0,
      };
      setConversations((prev) => {
        const normalized = normalizeConversations([...prev, newConv]);
        const found = normalized.find((item) => item.room === roomName);
        setSelectedContact(found || newConv);
        return normalized;
      });
    } else {
      setSelectedContact(existingConv);
    }
    
    setRoomInput("");
  };

  return (
    <div className="h-[calc(100vh+259px)] flex flex-col bg-white">
      <HeaderChat />
      
      {/* Room Join Section */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Current user: <strong>{user?.username || "Guest"}</strong></span>
          </div>
          <div className="flex-1 max-w-md">
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="Enter room name to join (e.g., 'test-room')"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
              >
                Join Room
              </button>
            </form>
          </div>
          {selectedRoom && (
            <div className="text-sm text-gray-600">
              Active room: <strong className="text-blue-600">{selectedRoom}</strong>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Sidebar - Messages List */}
        <div className="w-80 border-r flex-shrink-0">
          <MessageList
            conversations={filteredConversations}
            selectedRoom={selectedRoom}
            onSelectRoom={handleSelectRoom}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Right Side - Chat Window */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          {selectedContact ? (
            <ChatWindow
              roomName={selectedRoom}
              contactName={selectedContact.contactName}
              contactId={selectedContact.contactId}
              responseTime={selectedContact.responseTime}
              rating={selectedContact.rating}
              reviewCount={selectedContact.reviewCount}
              onMessageUpdate={handleConversationUpdate}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <Footer />
      </div>
    </div>
  );
}

