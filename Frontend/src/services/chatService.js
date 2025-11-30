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

  // Get user online status by ID
  getUserOnlineStatus: async (userId) => {
    try {
      const response = await api.get(`/chat/user/${userId}/status/`);
      return response.data;
    } catch (error) {
      return { user_id: userId, is_online: false };
    }
  },

  // Get user online status by username
  getUserOnlineStatusByUsername: async (username) => {
    try {
      const response = await api.get(`/chat/username/${username}/status/`);
      return response.data;
    } catch (error) {
      return { username, is_online: false };
    }
  },

  // Get room seen status
  getRoomSeenStatus: async (roomName) => {
    try {
      const response = await api.get(`/chat/${roomName}/seen/`);
      return response.data;
    } catch (error) {
      return { room: roomName, contact_seen_at: null };
    }
  },
};