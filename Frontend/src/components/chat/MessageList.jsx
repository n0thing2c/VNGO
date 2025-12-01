import { memo, useMemo } from "react";
import { Search } from "lucide-react";
import FloatingChatbotButton from "@/components/chat/ChatbotButton.jsx";

const isSameConversation = (prev, next) =>
  prev.room === next.room &&
  prev.contactName === next.contactName &&
  prev.contactAvatar === next.contactAvatar &&
  prev.isOnline === next.isOnline &&
  prev.hasUnread === next.hasUnread &&
  prev.lastMessage === next.lastMessage &&
  prev.lastMessageTime === next.lastMessageTime;

const ConversationItem = memo(
  function ConversationItem({ conversation, isSelected, onSelect }) {
    return (
      <div
        onClick={() => onSelect(conversation.room)}
        className={`p-4 cursor-pointer hover:bg-gray-50 transition ${isSelected ? "bg-gray-100 border border-black" : ""
          }`}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {conversation.contactName.toLowerCase().endsWith("chatbot") ?
            (<div className="h-12 w-12 text-[#020765] rounded-full bg-gradient-to-r from-[#020765]/10 to-[#23c491]/20 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7"
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
            </div>)
            : (
              <div className="relative flex-shrink-0">
                {conversation.contactAvatar ? (
                  <img
                    src={conversation.contactAvatar}
                    alt={conversation.contactName}
                    className="h-12 w-12 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                    {conversation.contactName?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                {/* Online status indicator */}
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    conversation.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>
            )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={`truncate ${
                conversation.hasUnread 
                  ? "font-bold text-gray-900" 
                  : "font-semibold text-gray-900"
              }`}>
                {conversation.contactName || "Unknown"}
              </h3>
              <div className="flex items-center gap-1.5 ml-2">
                {conversation.hasUnread && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
                {conversation.lastMessageTime && (
                  <span className={`text-xs flex-shrink-0 ${
                    conversation.hasUnread ? "text-blue-500 font-semibold" : "text-gray-500"
                  }`}>
                    {new Date(conversation.lastMessageTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>
            <p className={`text-sm truncate ${
              conversation.hasUnread 
                ? "text-gray-900 font-semibold" 
                : "text-gray-500"
            }`}>
              {conversation.lastMessage || "No message yet"}
            </p>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.onSelect === next.onSelect &&
    isSameConversation(prev.conversation, next.conversation)
);

function MessageList({
  conversations,
  selectedRoom,
  onSelectRoom,
  searchQuery,
  onSearchChange,
  onStartChatbot,
}) {
  const renderedConversations = useMemo(
    () =>
      conversations.map((conversation) => (
        <ConversationItem
          key={conversation.room}
          conversation={conversation}
          isSelected={selectedRoom === conversation.room}
          onSelect={onSelectRoom}
        />
      )),
    [conversations, selectedRoom, onSelectRoom]
  );
  return (
    <div className={`flex flex-col h-[100%] relative`}>
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
      <div className="flex-1 overflow-y-auto max-h-[65vh]">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No conversations yet</p>
          </div>
        ) : (
          <div className="pb-24">{renderedConversations}</div>
        )}
      </div>
      
      {/* Floating Chatbot Button - Fixed position */}
      <FloatingChatbotButton
        className="absolute bottom-4 left-4 z-10"
        onClick={() => {
          if (onStartChatbot) {
            onStartChatbot();
          }
        }}
      />
    </div>
  );
}

const arePropsEqual = (prev, next) =>
  prev.selectedRoom === next.selectedRoom &&
  prev.searchQuery === next.searchQuery &&
  prev.onSelectRoom === next.onSelectRoom &&
  prev.onSearchChange === next.onSearchChange &&
  prev.onStartChatbot === next.onStartChatbot &&
  prev.conversations.length === next.conversations.length &&
  prev.conversations.every((conv, index) =>
    isSameConversation(conv, next.conversations[index])
  );

export default memo(MessageList, arePropsEqual);
