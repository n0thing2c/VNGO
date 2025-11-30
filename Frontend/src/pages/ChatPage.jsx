import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import MessageList from "@/components/chat/MessageList";
import ChatWindow from "@/components/chat/ChatWindow";
import { chatService } from "@/services/chatService";
import { profileService } from "@/services/profileService";
import { useAuthStore } from "../../stores/useAuthStore";
import { notificationService } from "@/services/notifyService";
import { useLocation } from "react-router-dom";

const normalizeConversations = (items) => {
  const map = new Map();

  items.forEach((item) => {
    if (!item || !item.room) {
      return;
    }

    const existing = map.get(item.room);
    const currentTime = item.lastMessageTime
      ? new Date(item.lastMessageTime).getTime()
      : 0;
    const existingTime =
      existing && existing.lastMessageTime
        ? new Date(existing.lastMessageTime).getTime()
        : 0;

    if (!existing || currentTime >= existingTime) {
      // Preserve important fields from existing if item doesn't have them
      const merged = {
        ...existing,
        ...item,
      };
      // Preserve avatar from existing if item doesn't have one (or is null)
      if (existing?.contactAvatar && (!item.contactAvatar || item.contactAvatar === null)) {
        merged.contactAvatar = existing.contactAvatar;
      }
      // Preserve contactId from existing if item has null contactId but existing has a valid one
      if (existing?.contactId && (!item.contactId || item.contactId === null || item.contactId === item.room)) {
        merged.contactId = existing.contactId;
      }
      map.set(item.room, merged);
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA;
  });
};

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const { user, refreshUser, accessToken } = useAuthStore();
  const location = useLocation();
  const targetRoom = location.state?.targetRoom;
  const targetUser = location.state?.targetUser;
  const targetRoomRef = useRef(targetRoom);
  
  // Update ref when targetRoom changes
  useEffect(() => {
    targetRoomRef.current = targetRoom;
  }, [targetRoom]);

  const resolveRoomMateName = useCallback(
    (roomName) => {
      if (!roomName?.includes("__")) return null;
      const parts = roomName.split("__").filter(Boolean);
      if (parts.length === 0) return null;
      if (!user?.username) {
        return parts.join(" & ");
      }
      const lowerCurrent = user.username.toLowerCase();
      const partner = parts.find(
        (name) => name && name.toLowerCase() !== lowerCurrent
      );
      return partner || parts[0];
    },
    [user?.username]
  );

  // Ensure user data is loaded if we have a token but no user (fixes "first load" issue)
  useEffect(() => {
    if (accessToken && !user) {
      refreshUser();
    }
  }, [accessToken, user, refreshUser]);

  const withDisplayName = useCallback(
    (conversation) => {
      if (!conversation) return conversation;

      // Always prioritize parsing from room name to ensure getting the correct recipient
      let parsedName = resolveRoomMateName(conversation.room);

      // If parsing from room name failed, but contactName looks like a room name (contains " & "),
      // try to parse from contactName by treating it as a room name format
      if (!parsedName && conversation.contactName?.includes(" & ")) {
        // Try to extract partner name from "user1 & user2" format
        const parts = conversation.contactName.split(" & ").map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2 && user?.username) {
          const lowerCurrent = user.username.toLowerCase();
          const partner = parts.find(
            (name) => name && name.toLowerCase() !== lowerCurrent
          );
          if (partner) {
            parsedName = partner;
          }
        }
      }

      // If we successfully parsed a name, use it
      if (parsedName) {
        return {
          ...conversation,
          contactName: parsedName,
        };
      }

      // If parsing from room name fails, then use contactName from backend
      // But skip if it looks like a room name format
      const hasCustomName =
        conversation.contactName &&
        !conversation.contactName.toLowerCase().startsWith("room:") &&
        !conversation.contactName.includes(" & ");

      if (hasCustomName) {
        return {
          ...conversation,
          contactName: conversation.contactName.trim(),
        };
      }

      // Last resort: strip "Room:" prefix if present
      const stripped =
        conversation.contactName?.replace(/^Room:\s*/i, "").trim() || "";
      
      // If stripped still looks like room name, try to parse it one more time
      if (stripped.includes(" & ") && user?.username) {
        const parts = stripped.split(" & ").map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const lowerCurrent = user.username.toLowerCase();
          const partner = parts.find(
            (name) => name && name.toLowerCase() !== lowerCurrent
          );
          if (partner) {
            return {
              ...conversation,
              contactName: partner,
            };
          }
        }
      }

      return {
        ...conversation,
        contactName: stripped || "Unknown contact",
      };
    },
    [resolveRoomMateName, user?.username]
  );

  const normalizeAndEnhance = useCallback(
    (items) => normalizeConversations(items).map(withDisplayName),
    [withDisplayName]
  );

  const sortByLatest = useCallback(
    (a, b) => {
      const timeA = a?.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b?.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    },
    []
  );

  const handleConversationUpdate = useCallback(
    (roomName, message) => {
      if (!roomName) return;

      setConversations((prev) => {
        const existing = prev.find((c) => c.room === roomName);

        // Always prioritize parsing from room name to find partner (recipient)
        const parsedPartnerName = resolveRoomMateName(roomName);

        // If there is a message from another person (not the current user), use their username
        // Otherwise, use parsed name from room, or fallback to existing
        let otherUserName = parsedPartnerName;
        if (message?.sender && message.sender.id !== user?.id) {
          otherUserName = message.sender.username || parsedPartnerName || existing?.contactName || "Unknown contact";
        } else if (!parsedPartnerName) {
          otherUserName = existing?.contactName || "Unknown contact";
        }

        // Fix: Only get otherUserId from message if it's NOT the current user
        // If message is from current user, keep existing contactId or find from other messages
        let otherUserId = existing?.contactId;

        if (message?.sender) {
          const senderId = String(message.sender.id);
          const currentUserId = user?.id ? String(user.id) : null;

          // Only get ID from message if it's the recipient (not current user)
          if (currentUserId && senderId !== currentUserId) {
            otherUserId = senderId;
          } else if (!currentUserId) {
            // If user.id is not available, check by username
            const senderUsername = message.sender.username;
            const currentUsername = user?.username;
            if (senderUsername && senderUsername !== currentUsername) {
              otherUserId = senderId;
            }
          }
          // If message is from current user, keep existing?.contactId
        }

        // Fallback: If still no valid otherUserId, keep existing contactId or null
        // Don't use roomName as contactId as it's not a valid user ID
        if (!otherUserId || otherUserId === roomName) {
          otherUserId = existing?.contactId || null;
        }

        // Get avatar from message sender if available, otherwise use existing or selectedContact
        // Fix: Preserve avatar - prioritize existing, then message sender, then selectedContact
        let contactAvatar = existing?.contactAvatar;
        if (message?.sender && message.sender.id !== user?.id) {
          // Message from other person - use their avatar if available, otherwise keep existing
          contactAvatar = message.sender.avatar || message.sender.avatar_url || contactAvatar;
        } else if (!contactAvatar && selectedRoom === roomName && selectedContact?.room === roomName) {
          // Message from current user and no existing avatar - get from selectedContact
          contactAvatar = selectedContact.contactAvatar || null;
        }

        const updatedConversation = {
          room: roomName,
          contactName: otherUserName,
          contactId: otherUserId,
          contactAvatar: contactAvatar,
          isOnline: existing?.isOnline || false,
          nationality:
            existing?.nationality ||
            (message?.sender && message.sender.id !== user?.id
              ? message.sender.nationality
              : null),
          lastMessage:
            message?.content || existing?.lastMessage || "No message yet",
          lastMessageTime:
            message?.created_at || existing?.lastMessageTime || null,
          responseTime: existing?.responseTime || "30 minutes",
          rating: existing?.rating ?? 3.5,
          reviewCount: existing?.reviewCount ?? 0,
        };

        // If user is a guide and we don't have nationality yet, fetch it
        // Skip chatbot - check multiple conditions
        const otherUserIdLower = otherUserId?.toLowerCase();
        const otherUserNameLower = otherUserName?.toLowerCase().trim();
        const roomNameLower = roomName?.toLowerCase();
        const isChatbot = 
          otherUserIdLower === "chatbot" ||
          otherUserNameLower === "chatbot" ||
          roomNameLower?.endsWith("chatbot") ||
          roomNameLower?.includes("__chatbot") ||
          otherUserIdLower?.includes("chatbot");

        if (
          user?.role === "guide" &&
          !updatedConversation.nationality &&
          otherUserId &&
          otherUserId !== roomName &&
          !isChatbot
        ) {
          // Fetch nationality asynchronously without blocking the update
          profileService
            .getTouristPublicProfile(otherUserId)
            .then((res) => {
              if (res.success && res.data?.profile?.nationality) {
                setConversations((prev) => {
                  return prev.map((conv) => {
                    if (conv.room === roomName) {
                      return { ...conv, nationality: res.data.profile.nationality };
                    }
                    return conv;
                  });
                });
                
                // Update selectedContact if it matches
                if (selectedRoom === roomName) {
                  setSelectedContact((prev) => {
                    if (prev?.room === roomName) {
                      return { ...prev, nationality: res.data.profile.nationality };
                    }
                    return prev;
                  });
                }
              }
            })
            .catch((error) => {
              console.error("Error fetching tourist nationality:", error);
            });
        }

        const enhancedConversation = withDisplayName(updatedConversation);

        const others = prev.filter((c) => c.room !== roomName);
        const updatedList = [enhancedConversation, ...others].sort(sortByLatest);

        if (selectedRoom === roomName) {
          const found = updatedList.find((c) => c.room === roomName);
          if (found) {
            setSelectedContact(found);
          }
        }

        return updatedList;
      });
    },
    [withDisplayName, selectedRoom, selectedContact, user?.id, user?.username, resolveRoomMateName, sortByLatest]
  );

  // Load conversations from API when component mounts
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await chatService.getConversations();
        // Fix: If contactId is the same as roomName, set it to null (not a valid user ID)
        const cleaned = (data || []).map(conv => ({
          ...conv,
          contactId: conv.contactId && conv.contactId !== conv.room ? conv.contactId : null
        }));
        const normalized = normalizeAndEnhance(cleaned);
        setConversations(normalized);

        // Auto-select first conversation if available and no room is selected
        // But don't auto-select if we have a targetRoom (it will be handled by the targetRoom useEffect)
        if (normalized.length > 0 && !selectedRoom && !targetRoomRef.current) {
          setSelectedRoom(normalized[0].room);
          setSelectedContact(normalized[0]);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
      }
    };

    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic refresh to reflect messages from other rooms
  useEffect(() => {
    let isCancelled = false;
    const tick = async () => {
      try {
        const data = await chatService.getConversations();
        if (isCancelled) return;
        // Fix: If contactId is the same as roomName, set it to null (not a valid user ID)
        const cleaned = (data || []).map(conv => ({
          ...conv,
          contactId: conv.contactId && conv.contactId !== conv.room ? conv.contactId : null
        }));
        const normalized = normalizeAndEnhance(cleaned);
        setConversations((prev) => {
          // Merge keeping latest info and order
          const merged = normalizeAndEnhance([...prev, ...normalized]);
          return merged;
        });
        // Ensure targetRoom remains selected if it exists
        if (targetRoomRef.current) {
          setSelectedRoom(targetRoomRef.current);
        }
      } catch { }
    };

    const id = setInterval(tick, 5000); // 5s refresh
    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [normalizeAndEnhance]);

  // Realtime notifications for other rooms
  useEffect(() => {
    const handle = (data) => {
      if (!data || !data.room) return;
      const message = {
        content: data.message,
        created_at: data.created_at || new Date().toISOString(),
        sender: data.sender || null,
      };
      handleConversationUpdate(data.room, message);
    };

    notificationService.on("notification", handle);
    notificationService.connect();
    return () => {
      notificationService.off("notification", handle);
    };
  }, [handleConversationUpdate]);

  const normalizedConversations = useMemo(
    () => normalizeAndEnhance(conversations),
    [conversations, normalizeAndEnhance]
  );

  const filteredConversations = normalizedConversations.filter(
    (conv) =>
      conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.contactId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRoom = (roomName) => {
    setSelectedRoom(roomName);
    const contact = normalizedConversations.find((c) => c.room === roomName);
    
    // If contact not found, create a temporary contact from room name
    // contactId will be null initially and updated when messages arrive
    if (!contact && roomName) {
      const parsedName = resolveRoomMateName(roomName);
      const tempContact = {
        room: roomName,
        contactName: parsedName || "Unknown contact",
        contactId: null, // Will be updated when first message arrives
        contactAvatar: null,
        lastMessage: "No message yet",
        lastMessageTime: null,
        responseTime: "30 minutes",
        rating: 3.5,
        reviewCount: 0,
      };
      setSelectedContact(tempContact);
    } else {
      setSelectedContact(contact || null);
    }
  };

  const handleStartChatbot = () => {
    if (!user?.username) return;

    // Construct room name: username__chatbot
    // This ensures a private room for the user with the bot
    const botRoomName = `${user.username}__chatbot`;

    // Check if this room already exists in conversations
    const existing = conversations.find(c => c.room === botRoomName);

    if (existing) {
      handleSelectRoom(botRoomName);
    } else {
      // If not exists, we need to "create" it locally so ChatWindow can connect.
      // The backend will create the room/messages when we send the first message.
      // But we need to add it to the list so it's selectable.

      const newBotConversation = {
        room: botRoomName,
        contactName: "Chatbot",
        contactId: "chatbot",
        contactAvatar: null, // Or set a default bot avatar URL if available
        lastMessage: "Start chatting with our AI assistant!",
        lastMessageTime: new Date().toISOString(),
        responseTime: "Instant",
        rating: 5,
        reviewCount: 999,
      };

      setConversations(prev => {
        const normalized = normalizeAndEnhance([...prev, newBotConversation]);
        return normalized;
      });

      setSelectedRoom(botRoomName);
      setSelectedContact(newBotConversation);
    }
  };

  useEffect(() => {
    if (!targetRoom) return;

    const contactName =
      targetUser?.name?.trim() ||
      targetUser?.username ||
      "Unknown contact";
    // Fix: Only use targetUser.id as contactId, don't fallback to username or targetRoom
    // contactId must be a valid user ID, not a username or room name
    const contactId =
      targetUser?.id != null
        ? String(targetUser.id)
        : null;
    const contactAvatar = targetUser?.avatar || targetUser?.avatar_url || null;

    // Set selectedRoom immediately to prevent auto-selection of latest room
    setSelectedRoom(targetRoom);
    
    setConversations((prev) => {
      const existing = prev.find((c) => c.room === targetRoom);
      const updatedConversation = {
        room: targetRoom,
        contactName,
        contactId,
        contactAvatar: contactAvatar || existing?.contactAvatar || null,
        isOnline: existing?.isOnline || false,
        nationality: existing?.nationality || null,
        lastMessage: existing?.lastMessage || "No message yet",
        lastMessageTime: existing?.lastMessageTime || new Date().toISOString(),
        responseTime: existing?.responseTime || "30 minutes",
        rating: existing?.rating ?? 3.5,
        reviewCount: existing?.reviewCount ?? 0,
      };
      const filtered = prev.filter((c) => c.room === targetRoom);
      // Put targetRoom conversation first to ensure it's selected even after normalization
      const normalized = normalizeAndEnhance([
        updatedConversation,
        ...filtered,
      ]);
      const found = normalized.find((c) => c.room === targetRoom);
      setSelectedContact(found || updatedConversation);
      // Ensure selectedRoom is still set to targetRoom after normalization
      setSelectedRoom(targetRoom);
      return normalized;
    });
  }, [targetRoom, targetUser, normalizeAndEnhance]);

  // Fetch tourist nationality when guide selects a conversation with a tourist
  useEffect(() => {
    // Only fetch if user is a guide and we have a selected contact with an ID
    if (user?.role !== "guide" || !selectedContact?.contactId) return;
    
    // Skip if nationality is already set
    if (selectedContact.nationality) return;
    
    // Skip chatbot - check multiple conditions
    const contactIdLower = selectedContact.contactId?.toLowerCase();
    const contactNameLower = selectedContact.contactName?.toLowerCase().trim();
    const roomName = selectedContact.room?.toLowerCase();
    
    if (
      contactIdLower === "chatbot" ||
      contactNameLower === "chatbot" ||
      roomName?.endsWith("chatbot") ||
      roomName?.includes("__chatbot") ||
      contactIdLower?.includes("chatbot")
    ) {
      return;
    }

    // Fetch tourist public profile to get nationality
    const fetchTouristNationality = async () => {
      try {
        const res = await profileService.getTouristPublicProfile(selectedContact.contactId);
        if (res.success && res.data?.profile?.nationality) {
          const nationality = res.data.profile.nationality;
          
          // Update the conversation with nationality
          setConversations((prev) => {
            return prev.map((conv) => {
              if (conv.room === selectedContact.room) {
                return { ...conv, nationality };
              }
              return conv;
            });
          });
          
          // Update selectedContact if it matches
          if (selectedContact.room === selectedRoom) {
            setSelectedContact((prev) => {
              if (prev?.room === selectedContact.room) {
                return { ...prev, nationality };
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error("Error fetching tourist nationality:", error);
      }
    };

    fetchTouristNationality();
  }, [user?.role, selectedContact?.contactId, selectedContact?.room, selectedContact?.nationality, selectedRoom]);

  // Fetch contact avatar when contactId is available but avatar is missing
  useEffect(() => {
    // Skip if no contactId or already has avatar
    if (!selectedContact?.contactId || selectedContact.contactAvatar) return;
    
    // Skip chatbot
    const contactIdLower = selectedContact.contactId?.toLowerCase();
    const contactNameLower = selectedContact.contactName?.toLowerCase().trim();
    const roomName = selectedContact.room?.toLowerCase();
    
    if (
      contactIdLower === "chatbot" ||
      contactNameLower === "chatbot" ||
      roomName?.endsWith("chatbot") ||
      roomName?.includes("__chatbot") ||
      contactIdLower?.includes("chatbot")
    ) {
      return;
    }

    // Fetch avatar - determine profile type based on current user's role
    // If user is guide, contact must be tourist (and vice versa)
    const fetchContactAvatar = async () => {
      try {
        let avatar = null;
        
        // If current user is guide, contact must be tourist
        if (user?.role === "guide") {
          const touristRes = await profileService.getTouristPublicProfile(selectedContact.contactId);
          if (touristRes.success && touristRes.data?.profile?.face_image) {
            avatar = touristRes.data.profile.face_image;
          }
        } 
        // If current user is tourist, contact must be guide
        else if (user?.role === "tourist") {
          const guideRes = await profileService.getGuidePublicProfile(selectedContact.contactId);
          if (guideRes.success && guideRes.data?.face_image) {
            avatar = guideRes.data.face_image;
          }
        }
        // Fallback: try both if role is unknown (shouldn't happen, but just in case)
        else {
          // Try guide profile first
          const guideRes = await profileService.getGuidePublicProfile(selectedContact.contactId);
          if (guideRes.success && guideRes.data?.face_image) {
            avatar = guideRes.data.face_image;
          } else {
            // Try tourist profile
            const touristRes = await profileService.getTouristPublicProfile(selectedContact.contactId);
            if (touristRes.success && touristRes.data?.profile?.face_image) {
              avatar = touristRes.data.profile.face_image;
            }
          }
        }

        if (avatar) {
          // Update the conversation with avatar
          setConversations((prev) => {
            return prev.map((conv) => {
              if (conv.room === selectedContact.room) {
                return { ...conv, contactAvatar: avatar };
              }
              return conv;
            });
          });
          
          // Update selectedContact if it matches
          if (selectedContact.room === selectedRoom) {
            setSelectedContact((prev) => {
              if (prev?.room === selectedContact.room) {
                return { ...prev, contactAvatar: avatar };
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.error("Error fetching contact avatar:", error);
      }
    };

    fetchContactAvatar();
  }, [selectedContact?.contactId, selectedContact?.contactAvatar, selectedContact?.room, selectedRoom, user?.role]);

  return (
    <div>
      {/* Main Content */}
      <div className="flex px-[1%] py-[1%] gap-4 bg-gray-200" >
        {/* Left Sidebar - Messages List */}
        <div className="w-[17%] rounded-2xl bg-white">
          <MessageList
            conversations={filteredConversations}
            selectedRoom={selectedRoom}
            onSelectRoom={handleSelectRoom}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onStartChatbot={handleStartChatbot}
          />
        </div>

        {/* Right Side - Chat Window */}
        <div className="flex-1 rounded-2xl overflow-hidden bg-white">
          {selectedContact ? (
            <ChatWindow
              roomName={selectedRoom}
              contactName={selectedContact.contactName}
              contactId={selectedContact.contactId}
              contactAvatar={selectedContact.contactAvatar}
              contactNationality={selectedContact.nationality}
              responseTime={selectedContact.responseTime}
              rating={selectedContact.rating}
              reviewCount={selectedContact.reviewCount}
              onMessageUpdate={handleConversationUpdate}
              heightClass="min-h-[62vh] max-h-[62vh]"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center min-h-[79vh]">
              <p className="text-gray-500">
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
