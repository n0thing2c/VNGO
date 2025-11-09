import { useState, useEffect, useRef } from "react";
import { Send, Star } from "lucide-react";
import { websocketService } from "@/services/websocketService";
import { chatService } from "@/services/chatService";
import { useAuthStore } from "../../../stores/useAuthStore";

export default function ChatWindow({ roomName, contactName, contactId, responseTime, rating, reviewCount }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const processedMessagesRef = useRef(new Set()); // Track messages đã xử lý
  const { user } = useAuthStore();

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from API
  useEffect(() => {
    if (!roomName) {
      setMessages([]);
      processedMessagesRef.current.clear(); // Clear processed messages khi đổi room
      return;
    }
    
    // Clear processed messages khi load room mới
    processedMessagesRef.current.clear();

    const loadMessages = async () => {
      try {
        const data = await chatService.getMessages(roomName);
        console.log("Loaded messages:", data);
        console.log("Current user:", user);
        
        // Set messages mới, loại bỏ duplicate dựa trên ID
        setMessages((prev) => {
          if (!data || data.length === 0) return [];
          
          // Filter messages đã được xử lý
          const filteredData = data.filter((msg) => {
            const uniqueKey = msg.id ? `id_${msg.id}` : `content_${msg.content}_sender_${msg.sender?.id}_time_${msg.created_at}`;
            return !processedMessagesRef.current.has(uniqueKey);
          });
          
          // Đánh dấu các messages từ API đã được xử lý
          filteredData.forEach((msg) => {
            const uniqueKey = msg.id ? `id_${msg.id}` : `content_${msg.content}_sender_${msg.sender?.id}_time_${msg.created_at}`;
            processedMessagesRef.current.add(uniqueKey);
          });
          
          // Nếu prev rỗng, set mới
          if (prev.length === 0) {
            return filteredData;
          }
          
          // Merge với messages hiện có, tránh duplicate
          const existingIds = new Set(prev.map((msg) => msg.id));
          const newMessages = filteredData.filter((msg) => !existingIds.has(msg.id));
          
          if (newMessages.length === 0) return prev;
          
          // Merge và sort theo thời gian
          const merged = [...prev, ...newMessages].sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          return merged;
        });
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [roomName]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!roomName) return;

    const handleMessage = (data) => {
      if (data.type === "chat.message") {
        setMessages((prev) => {
          // Tạo unique key cho message
          const messageId = data.message_id;
          const created_at = data.created_at || new Date().toISOString();
          const uniqueKey = messageId 
            ? `id_${messageId}` 
            : `content_${data.message}_sender_${data.sender?.id}_time_${created_at}`;
          
          // Kiểm tra xem message đã được xử lý chưa
          if (processedMessagesRef.current.has(uniqueKey)) {
            console.log("Duplicate message detected (already processed), skipping:", data);
            return prev;
          }
          
          // Kiểm tra xem message đã tồn tại trong state chưa
          const exists = prev.some(
            (msg) =>
              (messageId && msg.id === messageId) ||
              (!messageId && 
                msg.content === data.message &&
                msg.sender?.id === data.sender?.id &&
                Math.abs(
                  new Date(msg.created_at).getTime() -
                  new Date(created_at).getTime()
                ) < 2000) // Nếu cùng content, sender và thời gian gần nhau (< 2s) thì coi như duplicate
          );
          
          if (exists) {
            console.log("Duplicate message detected (exists in state), skipping:", data);
            return prev;
          }
          
          // Đánh dấu message đã được xử lý
          processedMessagesRef.current.add(uniqueKey);
          
          // Giới hạn size của Set để tránh memory leak (giữ tối đa 1000 messages)
          if (processedMessagesRef.current.size > 1000) {
            const firstKey = processedMessagesRef.current.values().next().value;
            processedMessagesRef.current.delete(firstKey);
          }
          
          return [
            ...prev,
            {
              id: messageId || Date.now(),
              content: data.message,
              sender: data.sender,
              created_at: created_at,
            },
          ];
        });
      } else if (data.type === "typing") {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleConnected = () => {
      console.log("Connected to chat");
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
    };
  }, [roomName]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !websocketService.isConnected()) return;

    websocketService.sendMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleTyping = () => {
    if (websocketService.isConnected()) {
      websocketService.sendTyping();
    }
  };

  if (!roomName) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <p className="text-gray-500">Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
            {contactName?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{contactName || "Unknown"}</h2>
            {responseTime && (
              <p className="text-sm text-gray-500">Response time: {responseTime}</p>
            )}
          </div>
        </div>
        {rating !== undefined && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.floor(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : star <= rating
                      ? "fill-yellow-400/50 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            {reviewCount && (
              <span className="text-sm text-gray-600">({reviewCount.toLocaleString()})</span>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            // So sánh cả ID và username để đảm bảo chính xác
            const senderId = message.sender?.id;
            const senderUsername = message.sender?.username;
            const currentUserId = user?.id;
            const currentUsername = user?.username;
            
            // Kiểm tra xem message có phải của user hiện tại không
            // So sánh ID trước, nếu không có thì so sánh username
            const isOwnMessage = 
              (senderId != null && currentUserId != null && String(senderId) === String(currentUserId)) ||
              (senderUsername && currentUsername && senderUsername === currentUsername);
            
            const senderName = senderUsername || "Unknown";
            const senderInitial = senderName[0]?.toUpperCase() || "?";
            
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                {/* Avatar - chỉ hiển thị bên trái cho message của người khác */}
                {!isOwnMessage && (
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                    {senderInitial}
                  </div>
                )}
                
                {/* Message Bubble */}
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {senderName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <p className={`text-xs mt-1 ${isOwnMessage ? "opacity-75" : "text-gray-500"}`}>
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                
                {/* Avatar - chỉ hiển thị bên phải cho message của mình */}
                {isOwnMessage && (
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {currentUsername?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
            );
          })
        )}
        {isTyping && (
          <div className="flex justify-start items-end gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
              ?
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-none">
              <p className="text-sm text-gray-500 italic">Typing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message here"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !websocketService.isConnected()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

