import { Link, useLocation } from 'react-router-dom'; // <-- Rất quan trọng!
import { Menu, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'; // <-- Điều chỉnh đường dẫn nếu cần

import logo from '../../assets/LogoVNGO.png'
import GlobalSearchBar from '../GlobalSearchBar';
import { useAuthStore } from '@/stores/useAuthStore';

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
  return (
    <header className="bg-black sticky top-0 z-50 border-b border-black/10">
      <div className="max-w-full mx-auto px-2 md:px-4">
        <div className="flex items-center justify-between py-3 md:py-4">
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
                {/* Menu Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 outline-none hover:bg-white/20 rounded-full px-3 py-2 transition-colors">
                      <Menu className="w-10 h-10 text-white" />
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
                  <DropdownMenuContent align="end" className="w-48">
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
                    <DropdownMenuItem onClick={logout} className="text-[#CC3737]">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (!isLoginSignupPage && (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-4">
                  <Link to="/login">
                    <div className="border border-white text-white rounded-[30px] px-7 py-2.5 text-center hover:bg-white/10 transition cursor-pointer">
                      Login
                    </div>
                  </Link>
                  <Link to="/signup">
                    <div className="border border-[#23c491] text-[#23c491] rounded-[30px] px-7 py-2.5 text-center hover:bg-[#23c491]/10 transition cursor-pointer">
                      Sign up
                    </div>
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