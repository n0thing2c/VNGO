import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // <-- Very important!
import { Menu, ChevronDown, User, Map, Calendar, MessageSquare, LogOut, Bell, LogIn, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'; // <-- Adjust path if needed

import logo from '../../assets/LogoVNGO.png'
import GlobalSearchBar from '../GlobalSearchBar';
import { useAuthStore } from '@/stores/useAuthStore';
import { managementService } from '@/services/managementService';
import { notificationService } from '@/services/notifyService';
import { chatService } from '@/services/chatService';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const isLoginSignupPage = location.pathname === '/login' || location.pathname === '/signup';
  // Use "selector" (arrow function) so component only
  // re-renders when 'user' changes, not when 'loading' changes.
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoggedIn = !!user; // Create a convenient boolean variable
  const profileHref = user?.role === "tourist" ? "/tourist-profile/" : "/guide-profile/";

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // State for unread messages
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Calculate unread notifications for the red dot
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Calculate unread messages count
  const unreadMessagesCount = unreadMessages.length;

  // Helper function to resolve room mate name (extract contact name from room)
  const resolveRoomMateName = useCallback((room) => {
    if (!room || !user?.username) return room || "Unknown";
    const parts = room.split("__");
    if (parts.length !== 2) return room;
    const [a, b] = parts;
    return a === user.username ? b : a;
  }, [user?.username]);

  // Fetch unread messages from conversations
  const fetchUnreadMessages = useCallback(async () => {
    if (!isLoggedIn) return;

    setLoadingMessages(true);
    try {
      const data = await chatService.getConversations();
      if (data && Array.isArray(data)) {
        // Filter conversations that have unread messages
        const unread = data
          .filter((conv) => conv.has_unread || conv.hasUnread)
          .map((conv) => ({
            room: conv.room,
            contactName: conv.other_user_name || conv.contactName || resolveRoomMateName(conv.room),
            contactAvatar: conv.other_user_avatar || conv.contactAvatar || null,
            lastMessage: conv.last_message || conv.lastMessage || "New message",
            lastMessageTime: conv.last_message_time || conv.lastMessageTime || null,
          }));
        setUnreadMessages(unread);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
    setLoadingMessages(false);
  }, [isLoggedIn, resolveRoomMateName]);

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUnreadMessages([]);
      return;
    }

    let isMounted = true;

    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      const res = await managementService.getNotifications();
      if (isMounted && res.success) {
        setNotifications(res.data || []);
      }
      setLoadingNotifications(false);
    };

    fetchNotifications();
    fetchUnreadMessages();

    const handleWsNotification = (data) => {
      if (!data) return;

      // Handle booking notifications
      if (data.type === "booking_notification") {
        const newNotification = {
          id: data.id,
          booking_id: data.booking_id,
          tour_name: data.tour_name,
          notification_type: data.notification_type,
          message: data.message,
          is_read: data.is_read,
          created_at: data.created_at,
        };
        setNotifications((prev) => [newNotification, ...prev]);
      }

      // Handle new message notifications (from other rooms)
      if (data.room && data.message && data.sender) {
        // Check if this message is from another user (not current user)
        const senderId = data.sender?.id || data.sender;
        const isFromOther = String(senderId) !== String(user?.id);

        if (isFromOther) {
          const senderName = data.sender?.username || data.sender?.name || resolveRoomMateName(data.room);
          const newMessage = {
            room: data.room,
            contactName: senderName,
            contactAvatar: data.sender?.avatar || data.sender?.avatar_url || null,
            lastMessage: data.message,
            lastMessageTime: data.created_at || new Date().toISOString(),
          };

          setUnreadMessages((prev) => {
            // Update existing or add new
            const existing = prev.find((m) => m.room === data.room);
            if (existing) {
              return prev.map((m) =>
                m.room === data.room ? { ...m, ...newMessage } : m
              );
            }
            return [newMessage, ...prev];
          });
        }
      }
    };

    notificationService.on("notification", handleWsNotification);
    notificationService.connect();

    return () => {
      isMounted = false;
      notificationService.off("notification", handleWsNotification);
    };
  }, [isLoggedIn, user?.id, fetchUnreadMessages, resolveRoomMateName]);

  const handleNotificationClick = async (notif) => {
    if (!notif || notif.is_read) return;

    if (!notif.id) {
      // Local-only notification (no backend ID)
      setNotifications((prev) =>
        prev.map((n) => (n === notif ? { ...n, is_read: true } : n))
      );
      return;
    }

    const res = await managementService.markNotificationRead(notif.id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
  };

  // Handle clicking on a message notification - navigate to chat
  const handleMessageClick = (msg) => {
    if (!msg) return;
    // Remove from unread list
    setUnreadMessages((prev) => prev.filter((m) => m.room !== msg.room));
    // Navigate to chat page with the room using location.state
    navigate("/chat", {
      state: {
        targetRoom: msg.room,
        targetUser: {
          username: msg.contactName,
          name: msg.contactName,
          avatar: msg.contactAvatar,
          avatar_url: msg.contactAvatar,
        },
      },
    });
  };

  // Format message time
  const formatMessageTime = (msg) => {
    if (!msg || !msg.lastMessageTime) return "";
    const date = new Date(msg.lastMessageTime);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAllAsRead = async () => {
    if (!notifications.length) return;

    const res = await managementService.markAllNotificationsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const getNotificationTitle = (notif) => {
    if (!notif) return "Notification";
    const type = notif.notification_type;
    const tourName = notif.tour_name || "tour";

    if (type === "new_booking") {
      return `New booking: ${tourName}`;
    }
    if (type === "booking_accepted") {
      return `Booking accepted: ${tourName}`;
    }
    if (type === "booking_declined") {
      return `Booking declined: ${tourName}`;
    }
    if (type === "booking_reminder") {
      return `Review your tour: ${tourName}`;
    }

    return "Notification";
  };

  const formatNotificationTime = (notif) => {
    if (!notif || !notif.created_at) return "";
    const date = new Date(notif.created_at);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  };

  return (
    <header className="bg-black sticky top-0 z-50 border-b border-black/10">
      <div className="max-w-full mx-auto px-2 md:px-4">
        <div className="flex items-center justify-between py-2 md:py-3">
          {/* Logo - Clickable to home */}
          <div className="flex-shrink-0 basis-1/5 flex justify-start">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <img
                src={logo}
                alt="VNGO"
                className="h-15 w-auto" // adjust size here
              />
            </Link>
          </div>

          {/* Display search bar in the center IF NOT on home page and LoginSignup pages */}
          {!isHomePage && !isLoginSignupPage && (
            <div className="hidden md:flex justify-center flex-1 min-w-0 px-4">
              {/* USE GLOBAL COMPONENT */}
              <GlobalSearchBar />
            </div>
          )}

          <div className="flex-shrink-0 basis-1/5 flex justify-end">
            {/* User Menu with Dropdown */}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-2 md:gap-3">
                {/* 1. MESSAGE DROPDOWN */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="outline-none relative">
                    <div className="text-white hover:bg-white/20 p-2 rounded-full transition-colors relative">
                      <MessageSquare className="w-9 h-9" />
                      {unreadMessagesCount > 0 && (
                        <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black"></span>
                      )}
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-80 p-0 bg-white border-gray-200 shadow-xl rounded-xl overflow-hidden mt-2">
                    <DropdownMenuLabel className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">Messages</span>
                      {unreadMessagesCount > 0 && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                          {unreadMessagesCount} unread
                        </span>
                      )}
                    </DropdownMenuLabel>

                    <div className="max-h-[300px] overflow-y-auto">
                      {unreadMessages.length > 0 ? (
                        unreadMessages.map((msg) => (
                          <div
                            key={msg.room}
                            onClick={() => handleMessageClick(msg)}
                            className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors bg-green-50/50"
                          >
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              {msg.contactAvatar ? (
                                <img
                                  src={msg.contactAvatar}
                                  alt={msg.contactName}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                                  {msg.contactName?.[0]?.toUpperCase() || "?"}
                                </div>
                              )}
                              {/* Message Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-sm font-bold text-gray-900 truncate">
                                    {msg.contactName || "Unknown"}
                                  </h4>
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                    {formatMessageTime(msg)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 truncate font-medium">
                                  {msg.lastMessage}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No unread messages
                        </div>
                      )}
                    </div>

                    <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                      <Link
                        to="/chat"
                        className="text-xs font-semibold text-[#5A74F8] hover:underline"
                      >
                        View all messages
                      </Link>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* 2. NOTIFICATION DROPDOWN */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="outline-none relative">
                    <div className="text-white hover:bg-white/20 p-2 rounded-full transition-colors relative">
                      <Bell className="w-9 h-9" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></span>
                      )}
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-80 p-0 bg-white border-gray-200 shadow-xl rounded-xl overflow-hidden mt-2">
                    <DropdownMenuLabel className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <span className="font-bold text-gray-800">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </DropdownMenuLabel>

                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                {getNotificationTitle(notif)}
                              </h4>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                {formatNotificationTime(notif)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No new notifications
                        </div>
                      )}
                    </div>

                    <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
                      <button
                        className="text-xs font-semibold text-[#5A74F8] hover:underline"
                        onClick={handleMarkAllAsRead}
                        disabled={notifications.length === 0 || loadingNotifications}
                      >
                        Mark all as read
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Menu Dropdown */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="flex items-center gap-2 outline-none hover:bg-white/20 rounded-full px-3 py-2 transition-colors">
                    {/* <Menu className="w-10 h-10 text-white" /> */}
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt="avatar"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = logo;
                          }}
                        />
                      ) : (
                        <span className="text-[#5A74F8] text-sm font-semibold">
                          {user?.username?.slice(0, 2)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-5 h-5 text-white" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl w-36">
                    <DropdownMenuItem>
                      <Link to={profileHref} className="block w-full text-left">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'guide' ? (
                      <DropdownMenuItem>
                        <Link to="/management" className="block w-full text-left">
                          My Tours
                        </Link>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem>
                        <Link to="/management" className="block w-full text-left">
                          My Bookings
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Link to="/chat" className="block w-full text-left">
                        Message
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="block w-full text-left !text-[#CC3737]"> {/* '!' to keep red color */}
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (!isLoginSignupPage && (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-4">
                  <Link to="/login">
                    <button className="group flex items-center gap-2 text-white/90 hover:text-[#23c491] font-medium transition-all duration-200 px-3 py-2">
                      <LogIn className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-0.5" />
                      <span>Login</span>
                    </button>
                  </Link>
                  <Link to="/signup">
                    <button className="group flex items-center gap-2 text-[#23c491]/90 hover:text-[#23c491] font-medium transition-all duration-200 px-3 py-2">
                      <UserPlus className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-0.5" />
                      <span>Sign up</span>
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}