import { useState, useRef, useCallback, memo } from "react";
import { websocketService } from "@/services/websocketService";

const ChatInput = memo(({ onSendMessage, disabled = false }) => {
  const [newMessage, setNewMessage] = useState("");
  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(0);

  const handleTyping = useCallback(() => {
    if (!websocketService.isConnected()) return;

    const now = Date.now();
    // Throttle: chỉ gửi typing mỗi 500ms
    if (now - lastTypingTimeRef.current < 500) {
      return;
    }

    // Clear timeout cũ nếu có
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Gửi typing ngay lập tức nếu đã đủ thời gian
    websocketService.sendTyping();
    lastTypingTimeRef.current = now;

    // Debounce: nếu người dùng tiếp tục gõ, không gửi thêm typing trong 2s
    typingTimeoutRef.current = setTimeout(() => {
      // Reset sau 2s để có thể gửi typing lại
      lastTypingTimeRef.current = 0;
    }, 2000);
  }, []);

  const handleChange = useCallback((e) => {
    setNewMessage(e.target.value);
    handleTyping();
  }, [handleTyping]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!websocketService.isConnected() || disabled) return;

    const messageToSend = newMessage.trim() || "👍";
    onSendMessage(messageToSend);
    setNewMessage("");
  }, [newMessage, onSendMessage, disabled]);

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={handleChange}
          placeholder="Type your message here"
          className="flex-1 px-4 py-2 border border-black rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={!websocketService.isConnected() || disabled}
          className="
            p-3 rounded-full shrink-0 transition-all duration-200
            text-blue-600 hover:bg-blue-50 active:scale-95
            disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed
          "
        >
          {!newMessage.trim() ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 ml-1"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
});

ChatInput.displayName = "ChatInput";

export default ChatInput;

