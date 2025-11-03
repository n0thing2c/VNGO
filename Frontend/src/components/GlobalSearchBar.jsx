import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api'; // Đảm bảo server backend chạy ở cổng 8000

// Component này TỰ QUẢN LÝ state và logic của nó
export default function GlobalSearchBar() {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(""); // Vẫn giữ state, dù backend chưa dùng
  const [destinations, setDestinations] = useState([]);
  const navigate = useNavigate();

  // Tự fetch destinations khi component được tải
  useEffect(() => {
    fetch(`${API_URL}/locations/`)
      .then(res => res.json())
      .then(data => setDestinations(data.map(p => ({ id: p.id, name: p.name }))))
      .catch(err => console.error("Error fetching locations:", err));
  }, []); // [] = chạy 1 lần

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (location) {
      params.append('location', location);
    }
    // Bạn có thể thêm 'date' vào đây khi backend hỗ trợ
    
    // Điều hướng đến trang /tours với các param
    navigate(`/tours?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-full p-1 shadow-lg w-full max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-2 md:gap-0">
        
        {/* Location Selector */}
        <div className="flex-1 px-3 md:px-4 py-2 md:py-0 flex items-center border-r border-black/20">
          <MapPin className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-black/60" />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border-0 outline-none bg-transparent text-sm cursor-pointer"
          >
            <option value="">WHERE TO?</option>
            {destinations.map((dest) => (
              <option key={dest.id} value={dest.name}>{dest.name}</option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div className="flex-1 px-3 md:px-4 py-2 md:py-0 flex items-center">
          <Calendar className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-black/60" />
          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border-0 outline-none bg-transparent text-sm cursor-pointer"
          >
            <option value="">SELECT DATE</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="this-week">This Week</option>
          </select>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="bg-[#002D78] text-white px-6 py-3 rounded-full hover:bg-[#4a63d8] transition-colors font-medium flex items-center justify-center"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="hidden md:inline">Search</span>
            <span className="md:hidden">Go</span>
          </span>
        </button>
      </div>
    </div>
  );
}