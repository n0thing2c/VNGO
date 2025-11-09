import { useState, useEffect } from "react";
import HeaderChat from "@/components/HeaderChat";
import Footer from "@/components/Footer";
import MessageList from "@/components/chat/MessageList";
import ChatWindow from "@/components/chat/ChatWindow";
import { chatService } from "@/services/chatService";
import { useAuthStore } from "../../stores/useAuthStore";
import { Users } from "lucide-react";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [roomInput, setRoomInput] = useState("");
  const { user } = useAuthStore();

  useEffect(() => {
    if (selectedRoom) {
      const existingConv = conversations.find((c) => c.room === selectedRoom);
      if (!existingConv) {
        setConversations([
          {
            room: selectedRoom,
            contactName: `Room: ${selectedRoom}`,
            contactId: selectedRoom,
            lastMessage: "No message yet",
            lastMessageTime: null,
            responseTime: "30 minutes",
            rating: 3.5,
            reviewCount: 0,
          },
        ]);
      }
    }
  }, [selectedRoom]);

  useEffect(() => {
  }, []);

  const filteredConversations = conversations.filter((conv) =>
    conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contactId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRoom = (roomName) => {
    setSelectedRoom(roomName);
    const contact = conversations.find((c) => c.room === roomName);
    setSelectedContact(contact || null);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomInput.trim()) return;
    
    const roomName = roomInput.trim();
    setSelectedRoom(roomName);
    
    const existingConv = conversations.find((c) => c.room === roomName);
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
      setConversations((prev) => [...prev, newConv]);
      setSelectedContact(newConv);
    } else {
      setSelectedContact(existingConv);
    }
    
    setRoomInput("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
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
      <div className="flex-1 flex overflow-hidden">
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
        <div className="flex-1 flex flex-col min-w-0">
          {selectedContact ? (
            <ChatWindow
              roomName={selectedRoom}
              contactName={selectedContact.contactName}
              contactId={selectedContact.contactId}
              responseTime={selectedContact.responseTime}
              rating={selectedContact.rating}
              reviewCount={selectedContact.reviewCount}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

