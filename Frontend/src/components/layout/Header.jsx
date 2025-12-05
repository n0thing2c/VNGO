import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; // <-- Rất quan trọng!
import { Menu, ChevronDown, User, Map, Calendar, MessageSquare, LogOut, Bell, LogIn, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'; // <-- Điều chỉnh đường dẫn nếu cần

import logo from '../../assets/LogoVNGO.png'
import GlobalSearchBar from '../GlobalSearchBar';
import { useAuthStore } from '@/stores/useAuthStore';
import { managementService } from '@/services/managementService';
import { notificationService } from '@/services/notifyService';

export default function Header() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isLoginSignupPage = location.pathname === '/login' || location.pathname === '/signup';
  // Dùng "selector" (hàm mũi tên) để component chỉ
  // re-render khi 'user' thay đổi, chứ không phải khi 'loading' thay đổi.
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoggedIn = !!user; // Tạo một biến boolean tiện lợi
  const profileHref = user?.role === "tourist" ? "/tourist-profile/" : "/guide-profile/";
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Calculate unread notifications for the red dot
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
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

    const handleWsNotification = (data) => {
      if (!data || data.type !== "booking_notification") return;

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
    };

    notificationService.on("notification", handleWsNotification);
    notificationService.connect();

    return () => {
      isMounted = false;
      notificationService.off("notification", handleWsNotification);
    };
  }, [isLoggedIn]);

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
                className="h-15 w-auto" // điều chỉnh kích thước tại đây
              />
            </Link>
          </div>

          {/* Hiển thị search bar ở giữa NẾU KHÔNG PHẢI trang chủ và LoginSignup*/}
          {!isHomePage && !isLoginSignupPage && (
            <div className="hidden md:flex justify-center flex-1 min-w-0 px-4">
              {/* DÙNG COMPONENT TOÀN CỤC */}
              <GlobalSearchBar />
            </div>
          )}

          <div className="flex-shrink-0 basis-1/5 flex justify-end">
            {/* User Menu with Dropdown */}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-2 md:gap-3">
                {/* 1. NOTIFICATION DROPDOWN */}
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
                    <DropdownMenuItem onClick={logout} className="text-[#CC3737] hover:text-[#CC3737]/10">
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