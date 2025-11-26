import { Search } from "lucide-react";
import FloatingChatbotButton from "@/components/chat/ChatbotButton.jsx";

export default function MessageList({
  conversations,
  selectedRoom,
  onSelectRoom,
  searchQuery,
  onSearchChange,
}) {
  return (
    <div className={`flex flex-col h-[100%]`}>
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold mb-4">Messages</h1>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-black rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto relative ">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No conversations yet</p>
          </div>
        ) : (
          <div className="pb-24">
            {conversations.map((conversation) => (
              <div
                key={conversation.room}
                onClick={() => onSelectRoom(conversation.room)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                  selectedRoom === conversation.room ? "bg-gray-100 border border-black" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                    {conversation.contactName?.[0]?.toUpperCase() || "?"}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conversation.contactName || "Unknown"}
                      </h3>
                      {conversation.lastMessageTime && (
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(conversation.lastMessageTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage || "No message yet"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <FloatingChatbotButton className="absolute bottom-4 left-4 z-10" />
      </div>
    </div>
  );
}

