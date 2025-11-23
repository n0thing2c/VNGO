import api from "@/lib/axios";

export const chatService = {
  // Get user's list of conversations/rooms
  getConversations: async () => {
    const response = await api.get("/chat/conversations/");
    return response.data;
  },

  // Get list of messages for a room
  getMessages: async (roomName, limit = 100) => {
    const response = await api.get(`/chat/${roomName}/messages/`, {
      params: { limit },
    });
    return response.data;
  },
};