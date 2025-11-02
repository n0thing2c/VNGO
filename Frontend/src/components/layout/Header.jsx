import { Link } from 'react-router-dom'; // <-- Rất quan trọng!
import { Menu, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'; // <-- Điều chỉnh đường dẫn nếu cần

import logo from '../../assets/LogoVNGO.png'

export default function Header() {
  return (
    <header className="bg-black sticky top-0 z-50 border-b border-black/10">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 md:py-4">
          {/* Logo - Clickable to home */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src={logo}
              alt="VNGO"
              className="h-20 w-auto" // điều chỉnh kích thước tại đây
            />
          </Link>

          {/* User Menu with Dropdown */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none hover:bg-white/20 rounded-full px-3 py-2 transition-colors">
                <Menu className="w-10 h-10 text-white" />
                <ChevronDown className="w-5 h-5 text-white" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Dùng Link của react-router-dom */}
                <DropdownMenuItem asChild>
                  <Link to="/" className="w-full">Home</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tours" className="w-full">Show Tours</Link>
                </DropdownMenuItem>
                {/* Thêm link cho Guides, Reviews... khi bạn có trang đó */}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User avatar with dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 outline-none hover:bg-white/20 rounded-full pl-2 pr-1 py-1 transition-colors">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-[#5A74F8] text-sm font-semibold">TL</span>
                </div>
                <ChevronDown className="w-5 h-5 text-white" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>My Bookings</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}