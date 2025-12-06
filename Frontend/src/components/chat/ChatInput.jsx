import { useState, useRef, useCallback, memo, useEffect } from "react";
import { websocketService } from "@/services/websocketService";
import EmojiPicker from "emoji-picker-react";
import { Smile } from "lucide-react";

const ChatInput = memo(({ onSendMessage, disabled = false }) => {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(0);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const inputRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleTyping = useCallback(() => {
    if (!websocketService.isConnected()) return;

    const now = Date.now();
    // Throttle: only send typing every 500ms
    if (now - lastTypingTimeRef.current < 500) {
      return;
    }

    // Clear existing timeout if any
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing immediately if enough time has passed
    websocketService.sendTyping();
    lastTypingTimeRef.current = now;

    // Debounce: if user continues typing, don't send additional typing for 2s
    typingTimeoutRef.current = setTimeout(() => {
      // Reset after 2s to allow sending typing again
      lastTypingTimeRef.current = 0;
    }, 2000);
  }, []);

  const handleChange = useCallback((e) => {
    setNewMessage(e.target.value);
    handleTyping();
  }, [handleTyping]);

  const handleEmojiClick = useCallback((emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    // Focus back to input after selecting emoji
    inputRef.current?.focus();
  }, []);

  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker((prev) => !prev);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!websocketService.isConnected() || disabled) return;

    const messageToSend = newMessage.trim() || "👍";
    onSendMessage(messageToSend);
    setNewMessage("");
    setShowEmojiPicker(false);
  }, [newMessage, onSendMessage, disabled]);

  return (
    <form onSubmit={handleSubmit} className="p-4 relative">
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full right-16 mb-2 z-50"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={320}
            height={400}
            searchPlaceholder="Search emoji..."
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
            lazyLoadEmojis
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={handleChange}
          placeholder="Aa"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
          disabled={disabled}
        />

        {/* Emoji Button - Messenger style (right side) */}
        <button
          ref={emojiButtonRef}
          type="button"
          onClick={toggleEmojiPicker}
          className={`
            p-2 rounded-full shrink-0 transition-all duration-200
            text-blue-600 hover:bg-blue-50 active:scale-95
            ${showEmojiPicker ? "bg-blue-50" : ""}
          `}
          title="Emoji"
        >
          <Smile className="w-6 h-6" />
        </button>

        {/* Send / Like Button */}
        <button
          type="submit"
          disabled={!websocketService.isConnected() || disabled}
          className="
            p-2 rounded-full shrink-0 transition-all duration-200
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
              className="w-6 h-6"
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

