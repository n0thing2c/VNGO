import api from "@/lib/axios";

export const chatService = {
  getMessages: async (roomName, limit = 50) => {
    const response = await api.get(`/chat/${roomName}/messages/`, {
      params: { limit },
    });
    return response.data;
  },

  createMessage: async (roomName, content) => {
    const response = await api.post(`/chat/${roomName}/messages/create/`, {
      content,
    });
    return response.data;
  },
};

