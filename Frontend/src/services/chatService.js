import api from "@/lib/axios";

export const chatService = {
  // Lấy danh sách conversations/rooms của user
  getConversations: async () => {
    const response = await api.get("/chat/conversations/");
    return response.data;
  },

  // Lấy danh sách messages của một room
  getMessages: async (roomName, limit = 100) => {
    const response = await api.get(`/chat/${roomName}/messages/`, {
      params: { limit },
    });
    return response.data;
  },
};