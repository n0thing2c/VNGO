import { memo, useMemo } from "react";
import { Search } from "lucide-react";
import FloatingChatbotButton from "@/components/chat/ChatbotButton.jsx";

const isSameConversation = (prev, next) =>
  prev.room === next.room &&
  prev.contactName === next.contactName &&
  prev.contactAvatar === next.contactAvatar &&
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
            (<div className=" h-12 w-12 text-black rounded-full bg-gray-300 flex items-center justify-center group">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 122.88 119.35"
                className="w-8 h-8 fill-current"
              >
                <path d="M57.49,29.2V23.53a14.41,14.41,0,0,1-2-.93A12.18,12.18,0,0,1,50.44,7.5a12.39,12.39,0,0,1,2.64-3.95A12.21,12.21,0,0,1,57,.92,12,12,0,0,1,61.66,0,12.14,12.14,0,0,1,72.88,7.5a12.14,12.14,0,0,1,0,9.27,12.08,12.08,0,0,1-2.64,3.94l-.06.06a12.74,12.74,0,0,1-2.36,1.83,11.26,11.26,0,0,1-2,.93V29.2H94.3a15.47,15.47,0,0,1,15.42,15.43v2.29H115a7.93,7.93,0,0,1,7.9,7.91V73.2A7.93,7.93,0,0,1,115,81.11h-5.25v2.07A15.48,15.48,0,0,1,94.3,98.61H55.23L31.81,118.72a2.58,2.58,0,0,1-3.65-.29,2.63,2.63,0,0,1-.63-1.85l1.25-18h-.21A15.45,15.45,0,0,1,13.16,83.18V81.11H7.91A7.93,7.93,0,0,1,0,73.2V54.83a7.93,7.93,0,0,1,7.9-7.91h5.26v-2.3A15.45,15.45,0,0,1,28.57,29.2H57.49ZM82.74,47.32a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm-42.58,0a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm6.38,31.36a2.28,2.28,0,0,1-.38-.38,2.18,2.18,0,0,1-.52-1.36,2.21,2.21,0,0,1,.46-1.39,2.4,2.4,0,0,1,.39-.39,3.22,3.22,0,0,1,3.88-.08A22.36,22.36,0,0,0,56,78.32a14.86,14.86,0,0,0,5.47,1A16.18,16.18,0,0,0,67,78.22,25.39,25.39,0,0,0,72.75,75a3.24,3.24,0,0,1,3.89.18,3,3,0,0,1,.37.41,2.22,2.22,0,0,1,.42,1.4,2.33,2.33,0,0,1-.58,1.35,2.29,2.29,0,0,1-.43.38,30.59,30.59,0,0,1-7.33,4,22.28,22.28,0,0,1-7.53,1.43A21.22,21.22,0,0,1,54,82.87a27.78,27.78,0,0,1-7.41-4.16l0,0ZM94.29,34.4H28.57A10.26,10.26,0,0,0,18.35,44.63V83.18A10.26,10.26,0,0,0,28.57,93.41h3.17a2.61,2.61,0,0,1,2.41,2.77l-1,14.58L52.45,94.15a2.56,2.56,0,0,1,1.83-.75h40a10.26,10.26,0,0,0,10.22-10.23V44.62A10.24,10.24,0,0,0,94.29,34.4Z" />
              </svg>
            </div>)
            : (conversation.contactAvatar ? (
              <img
                src={conversation.contactAvatar}
                alt={conversation.contactName}
                className="h-12 w-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                {conversation.contactName?.[0]?.toUpperCase() || "?"}
              </div>
            ))}

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
      <div className="flex-1 overflow-y-auto relative max-h-[70vh]">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No conversations yet</p>
          </div>
        ) : (
          <div className="pb-24">{renderedConversations}</div>
        )}
        <FloatingChatbotButton
          className="absolute bottom-4 left-4 z-10"
          onClick={() => {
            if (onStartChatbot) {
              onStartChatbot();
            }
          }}
        />
      </div>
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
