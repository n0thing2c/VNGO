import { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import { useAuthStore } from "@/stores/useAuthStore"
import { notificationService } from "@/services/notifyService"
import FloatingChatbotButton from "@/components/chat/ChatbotButton"
import { toast } from "sonner"

export default function Layout() {
  const { accessToken, user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Ẩn chatbot button trên các trang: chat, login, signup, verify-email, 404
  const hideChatbotPages = ["/chat", "/login", "/signup", "/verify-email", "/forget-password", "/reset-password"];
  const shouldHideChatbot = hideChatbotPages.includes(location.pathname);
  
  // Kiểm tra nếu đang ở trang 404 (pathname không khớp với các route hợp lệ)
  const validRoutePatterns = [
    /^\/$/,
    /^\/signup$/, 
    /^\/verify-email$/,
    /^\/login$/,
    /^\/forget-password$/,
    /^\/reset-password$/,
    /^\/tour\/post\/.+$/,
    /^\/tour\/[^\/]+$/,
    /^\/tours$/,
    /^\/public-profile\/.+$/,
    /^\/tourist-public-profile\/.+$/,
    /^\/chat$/,
    /^\/management$/,
    /^\/tourist-profile$/,
    /^\/guide-profile$/,
    /^\/tour\/create$/,
    /^\/tour\/edit\/.+$/,
  ];
  
  const is404Page = !validRoutePatterns.some(pattern => pattern.test(location.pathname));
  const shouldHideChatbotOn404 = shouldHideChatbot || is404Page;

  // Connect to notification service when user is authenticated
  // This sets the user as "online" in the system
  useEffect(() => {
    if (accessToken) {
      notificationService.connect();
    }
  }, [accessToken]);

  // Force profile completion
  useEffect(() => {
    if (accessToken && user && !user.profile_completed) {
      const role = user.role?.toLowerCase();
      let targetPath = "/";

      if (role === 'guide') targetPath = "/guide-profile";
      else if (role === 'tourist') targetPath = "/tourist-profile";

      // Only redirect if we have a valid target path and we are not already there
      if (targetPath !== "/" && location.pathname !== targetPath) {
        toast.info("You must complete your profile first.");
        navigate(targetPath, { replace: true });
      }
    }
  }, [accessToken, user, location.pathname, navigate]);

  return (
    <>
      <Header />
      <main>
        {/* Tất cả các trang của bạn (Home, Tours...) sẽ được render ở đây */}
        <Outlet />
      </main>
      <Footer />

      {/* Floating Chat Button - ẩn trên trang chat, login, signup, verify-email, 404 */}
      {!shouldHideChatbotOn404 && <FloatingChatbotButton />}
    </>
  );
}