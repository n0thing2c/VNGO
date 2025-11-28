import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TypingIndicator from "./TypingIndicator";

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

const MessageItem = memo(({ message, isOwnMessage, senderName, senderAvatar, senderInitial, userAvatar, roomName, user }) => {
  const displayTime = useMemo(() => {
    return new Date(message.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [message.created_at]);

  return (
    <div
      className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      {!isOwnMessage && (
        roomName.endsWith("chatbot") ? (
          <div className="h-8 w-8 p-1 text-black rounded-full bg-gray-300 flex items-center justify-center group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 122.88 119.35"
              className="w-8 h-8 fill-current"
            >
              <path d="M57.49,29.2V23.53a14.41,14.41,0,0,1-2-.93A12.18,12.18,0,0,1,50.44,7.5a12.39,12.39,0,0,1,2.64-3.95A12.21,12.21,0,0,1,57,.92,12,12,0,0,1,61.66,0,12.14,12.14,0,0,1,72.88,7.5a12.14,12.14,0,0,1,0,9.27,12.08,12.08,0,0,1-2.64,3.94l-.06.06a12.74,12.74,0,0,1-2.36,1.83,11.26,11.26,0,0,1-2,.93V29.2H94.3a15.47,15.47,0,0,1,15.42,15.43v2.29H115a7.93,7.93,0,0,1,7.9,7.91V73.2A7.93,7.93,0,0,1,115,81.11h-5.25v2.07A15.48,15.48,0,0,1,94.3,98.61H55.23L31.81,118.72a2.58,2.58,0,0,1-3.65-.29,2.63,2.63,0,0,1-.63-1.85l1.25-18h-.21A15.45,15.45,0,0,1,13.16,83.18V81.11H7.91A7.93,7.93,0,0,1,0,73.2V54.83a7.93,7.93,0,0,1,7.9-7.91h5.26v-2.3A15.45,15.45,0,0,1,28.57,29.2H57.49ZM82.74,47.32a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm-42.58,0a9.36,9.36,0,1,1-9.36,9.36,9.36,9.36,0,0,1,9.36-9.36Zm6.38,31.36a2.28,2.28,0,0,1-.38-.38,2.18,2.18,0,0,1-.52-1.36,2.21,2.21,0,0,1,.46-1.39,2.4,2.4,0,0,1,.39-.39,3.22,3.22,0,0,1,3.88-.08A22.36,22.36,0,0,0,56,78.32a14.86,14.86,0,0,0,5.47,1A16.18,16.18,0,0,0,67,78.22,25.39,25.39,0,0,0,72.75,75a3.24,3.24,0,0,1,3.89.18,3,3,0,0,1,.37.41,2.22,2.22,0,0,1,.42,1.4,2.33,2.33,0,0,1-.58,1.35,2.29,2.29,0,0,1-.43.38,30.59,30.59,0,0,1-7.33,4,22.28,22.28,0,0,1-7.53,1.43A21.22,21.22,0,0,1,54,82.87a27.78,27.78,0,0,1-7.41-4.16l0,0ZM94.29,34.4H28.57A10.26,10.26,0,0,0,18.35,44.63V83.18A10.26,10.26,0,0,0,28.57,93.41h3.17a2.61,2.61,0,0,1,2.41,2.77l-1,14.58L52.45,94.15a2.56,2.56,0,0,1,1.83-.75h40a10.26,10.26,0,0,0,10.22-10.23V44.62A10.24,10.24,0,0,0,94.29,34.4Z" />
            </svg>
          </div>
        ) : senderAvatar ? (
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
          {displayTime}
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

MessageItem.displayName = "MessageItem";

const MessagesList = memo(({ messages, user, roomName, userAvatar, isTyping, contactName, contactAvatar }) => {
  const renderedMessages = useMemo(() => {
    if (messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full py-[15%] text-gray-500">
          No messages yet. Start the conversation!
        </div>
      );
    }

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
        <MessageItem
          key={`${message.id ?? "tmp"}-${message.created_at}`}
          message={message}
          isOwnMessage={isOwnMessage}
          senderName={senderName}
          senderAvatar={senderAvatar}
          senderInitial={senderInitial}
          userAvatar={userAvatar}
          roomName={roomName}
          user={user}
        />
      );
    });

    return rendered;
  }, [messages, user, roomName, userAvatar]);

  return (
    <>
      {renderedMessages}
      {isTyping && (
        <TypingIndicator
          contactName={contactName}
          contactAvatar={contactAvatar}
          roomName={roomName}
        />
      )}
    </>
  );
});

MessagesList.displayName = "MessagesList";

export default MessagesList;

