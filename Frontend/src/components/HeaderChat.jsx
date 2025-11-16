import Logo from "@/assets/LogoVNGO.png";
import { Search, Menu, MapPin } from "lucide-react";
import { useAuthStore } from "../../stores/useAuthStore";

export default function HeaderChat() {
  const { user } = useAuthStore();

  return (
    <div
      className="w-full"
      style={{
        background: "black",
      }}
    >
      <div className="w-full h-20 flex items-center justify-between">
        {/* Logo - Góc trái, to ra */}
        <div className="flex items-center flex-shrink-0 pl-4">
          <img
            src={Logo}
            alt="VNGO"
            className="h-20 w-20 object-contain"
          />
        </div>

        {/* Search Bar - Ở giữa */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative flex items-center bg-white/10 rounded-lg px-4 py-2">
            <MapPin className="w-5 h-5 text-white mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="WHERE TO?"
              className="flex-1 bg-transparent text-white placeholder-white/70 outline-none text-sm"
            />
            <button className="ml-2 p-1 bg-green-500 rounded hover:bg-green-600 transition flex-shrink-0">
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Right side: Menu and User Avatar - Góc phải */}
        <div className="flex items-center gap-4 flex-shrink-0 pr-4">
          <button className="text-white hover:text-gray-300 transition">
            <Menu className="w-6 h-6" />
          </button>
          {user && (
            <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
              {user.username?.[0]?.toUpperCase() || "U"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

