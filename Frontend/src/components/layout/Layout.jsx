import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import { useAuthStore } from "@/stores/useAuthStore"
import { notificationService } from "@/services/notifyService"

export default function Layout() {
  const { accessToken } = useAuthStore();

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
    </>
  );
}