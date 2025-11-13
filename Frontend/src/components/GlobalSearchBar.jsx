import {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {MapPin, Loader2} from 'lucide-react';

// API
import { API_ENDPOINTS } from "@/constant";

function unAccent(str) {
  if (!str) return "";
  return str
    .normalize("NFD") // Tách chữ và dấu
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
    .toLowerCase();
}

export default function GlobalSearchBar() {
    const [location, setLocation] = useState("");
    const [allDestinations, setAllDestinations] = useState([]); // Lưu tỉnh/tp/may be phường-xã
    const [filteredDestinations, setFilteredDestinations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Thêm state cho loading và lỗi
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    const navigate = useNavigate();
    const inputRef = useRef(null);

    // Fetch all destinations at once while loading
    useEffect(() => {
        setIsLoading(true); // Bật loading
        setFetchError(false);
        fetch(API_ENDPOINTS.GET_ALL_PROVINCES)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch provinces');
                return res.json();
            })
            .then(data => {
                setAllDestinations(data);
            })
            .catch(err => {
                console.error("Error fetching locations:", err);
                setFetchError(true); // Báo lỗi nếu API hỏng
            })
            .finally(() => setIsLoading(false)); // Tắt loading
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setLocation(value);

        // // Only suggest if at least one word is typed
        if (value.trim().split(' ').filter(Boolean).length >= 1) {
        // if (value.trim().length > 0) {
            // const lowerValue = value.toLowerCase();
            // const seen = new Set();
            // Tách dấu của từ khóa tìm kiếm
            const lowerValue = unAccent(value);

            const filtered = allDestinations.filter(dest => {
                const matchVi = unAccent(dest.province_vi).toLowerCase().includes(lowerValue);
                const matchEn = unAccent(dest.province_en).toLowerCase().includes(lowerValue);
                return matchVi || matchEn;
            })

            // DEBUG: Thêm dòng log này
            console.log("Filtered:", filtered);

            setFilteredDestinations(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };


    const handleSelectSuggestion = (province) => {
        setLocation(province.province_en);
        setShowSuggestions(false);
        // CHUYỂN TRANG với param `location` SẠCH
        navigate(`/tours?location=${encodeURIComponent(province.province_en)}`);
    };

    const handleSearch = () => {
        // // Nếu hàm được gọi từ 'handleSelectSuggestion', nó sẽ có searchQuery.
        // // Nếu không (bấm nút search), dùng state 'location'.
        // const query = (typeof searchQuery === 'string') ? searchQuery : location;
        // const params = new URLSearchParams();
        // if (query) params.append('search', query);
        // navigate(`/tours?${params.toString()}`);
        // setShowSuggestions(false); // Ẩn gợi ý sau khi search

        // KHÔNG LÀM GÌ CẢ
        // Hoặc báo user phải chọn
        // (Nếu muốn thân thiện, có thể tự động chọn suggestion đầu tiên)
        if (filteredDestinations.length > 0) {
            handleSelectSuggestion(filteredDestinations[0]);
        }
    };

    // Handle enter
    const handleKeyDown = (e) => {
        // if (e.key === 'Enter') {
        //     handleSearch();
        // }
        if (e.key === 'Enter') {
            if (filteredDestinations.length > 0) {
                // Chọn suggestion đầu tiên
                handleSelectSuggestion(filteredDestinations[0]);
            } else {
                // Nếu không có, chặn `Enter`
                e.preventDefault(); 
            }
        }
    }

    // Close suggestions if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="bg-white rounded-full p-1 shadow-lg w-full max-w-xl mx-auto">
            <div className="flex flex-col md:flex-row items-center md:items-stretch gap-2 md:gap-0">

                {/* Location Input */}
                <div ref={inputRef}
                     className="flex-1 px-3 md:px-4 py-2 md:py-0 flex flex-col relative">
                    <div className="flex flex-1 items-center gap-3">
                        <MapPin className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-black/60"/>
                        <input
                            type="text"
                            value={location}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="WHERE TO?"
                            className="w-full border-0 outline-none bg-transparent text-sm"
                        />
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && ( //&& filteredDestinations.length > 0 && (
                        <ul className="absolute top-full left-10 right-0 bg-white border border-gray-200 rounded-md shadow-md mt-1 max-h-48 overflow-y-auto z-10">
                            {filteredDestinations.length > 0 ? (
                                filteredDestinations.map((dest, index) => (
                                    <li
                                        key={index}
                                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm text-start"
                                        onClick={() => handleSelectSuggestion(dest)}
                                    >
                                        {dest.province_en} ({dest.province_vi})
                                    </li>
                                ))
                            ) : (
                                // Hiện "No results"
                                <li className="px-3 py-2 text-gray-500 italic text-sm text-start">
                                    No results found.
                                </li>
                            )}
                        </ul>
                    )}
                    {/* Hiện lỗi nếu API hỏng */}
                    {fetchError && (
                         <div className="absolute top-full left-10 right-0 p-2 text-red-500 bg-white border border-red-300 rounded-md shadow-md mt-1 z-10 text-sm">
                            Error: Could not load locations.
                         </div>
                    )}
                </div>
                {/*/!* Date Selector *!/*/}
                {/*<div className="flex-1 px-3 md:px-4 py-2 md:py-0 flex items-center">*/}
                {/*  <Calendar className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-black/60" />*/}
                {/*  <select*/}
                {/*    value={date}*/}
                {/*    onChange={(e) => setDate(e.target.value)}*/}
                {/*    className="w-full border-0 outline-none bg-transparent text-sm cursor-pointer"*/}
                {/*  >*/}
                {/*    <option value="">SELECT DATE</option>*/}
                {/*    <option value="today">Today</option>*/}
                {/*    <option value="tomorrow">Tomorrow</option>*/}
                {/*    <option value="this-week">This Week</option>*/}
                {/*  </select>*/}
                {/*</div>*/}
                {/* Search Button */}
                {/* Nút Search giờ sẽ chọn suggestion đầu tiên */}
                <button
                    onClick={() => handleSearch()}
                    className="bg-[#002D78] text-white px-6 py-3 rounded-full hover:bg-[#4a63d8] transition-colors font-medium flex items-center justify-center mr-1"
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
