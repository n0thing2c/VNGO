import { useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import { useAuthStore } from "@/stores/useAuthStore"
import { notificationService } from "@/services/notifyService"
import FloatingChatbotButton from "@/components/chat/ChatbotButton"

export default function Layout() {
  const { accessToken } = useAuthStore();
  const location = useLocation();

  // Ẩn chatbot button trên các trang: chat, login, signup, verify-email
  const hideChatbotPages = ["/chat", "/login", "/signup", "/verify-email"];
  const shouldHideChatbot = hideChatbotPages.includes(location.pathname);

  // Connect to notification service when user is authenticated
  // This sets the user as "online" in the system
  useEffect(() => {
    if (accessToken) {
      notificationService.connect();
    }
  }, [accessToken]);

  return (
    <>
      <Header />
      <main>
        {/* Tất cả các trang của bạn (Home, Tours...) sẽ được render ở đây */}
        <Outlet />
      </main>
      <Footer />
      
      {/* Floating Chat Button - ẩn trên trang chat, login, signup, verify-email */}
      {!shouldHideChatbot && <FloatingChatbotButton />}
    </>
  );
}