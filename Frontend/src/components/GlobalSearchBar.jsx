import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Loader2, Search, ChevronDown } from 'lucide-react';

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
    const [searchParams] = useSearchParams();
    const inputRef = useRef(null);

    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Sync location from URL
    useEffect(() => {
        const locationParam = searchParams.get('location');
        if (locationParam) {
            // setLocation(locationParam);
            setLocation(locationParam.replace(/\b(City|Province)\b/gi, "").trim());
        }
    }, [searchParams]);

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
        setSelectedIndex(-1); // Reset selection on input change

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

    const handleShowAll = () => {
        if (showSuggestions) {
            setShowSuggestions(false);
        } else {
            setFilteredDestinations(allDestinations);
            setShowSuggestions(true);
        }
    };


    const handleSelectSuggestion = (province) => {
        // setLocation(province.province_en);
        const trimmedName = province.province_en.replace(/\b(City|Province)\b/gi, "").trim();
        setLocation(trimmedName);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        // CHUYỂN TRANG với param `location` SẠCH
        // navigate(`/tours?location=${encodeURIComponent(province.province_en)}`);
        navigate(`/tours?location=${encodeURIComponent(trimmedName)}`);
    };

    const handleSearch = () => {
        // // Nếu hàm được gọi từ 'handleSelectSuggestion', nó sẽ có searchQuery.
        // // Nếu không (bấm nút search), dùng state 'location'.
        // const query = (typeof searchQuery === 'string') ? searchQuery : location;
        // const params = new URLSearchParams();
        // if (query) params.append('search', query);
        // navigate(`/tours?${params.toString()}`);
        // setShowSuggestions(false); // Ẩn gợi ý sau khi search

        // // KHÔNG LÀM GÌ CẢ
        // // Hoặc báo user phải chọn
        // // (Nếu muốn thân thiện, có thể tự động chọn suggestion đầu tiên)
        // if (filteredDestinations.length > 0) {
        //     // Nếu có item đang chọn thì dùng item đó, không thì dùng item đầu tiên
        //     const index = selectedIndex >= 0 ? selectedIndex : 0;
        //     handleSelectSuggestion(filteredDestinations[index]);
        // }

        // Priority 1: User explicitly selected a suggestion
        if (selectedIndex >= 0 && filteredDestinations[selectedIndex]) {
            handleSelectSuggestion(filteredDestinations[selectedIndex]);
            return;
        }

        // Priority 2: User typed something -> pick the top match
        if (location.trim().length > 0 && filteredDestinations.length > 0) {
            handleSelectSuggestion(filteredDestinations[0]);
            return;
        }

        // Priority 3: Empty input & no selection -> Show all tours
        setShowSuggestions(false);
        navigate('/tours');
    };

    // Handle enter
    const handleKeyDown = (e) => {
        if (!showSuggestions || filteredDestinations.length === 0) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Chặn submit form nếu không có suggestion
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < filteredDestinations.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                handleSelectSuggestion(filteredDestinations[selectedIndex]);
            } else if (filteredDestinations.length > 0) {
                // Nếu chưa chọn gì mà bấm Enter thì chọn cái đầu tiên
                handleSelectSuggestion(filteredDestinations[0]);
            }
        }
    }

    // Close suggestions if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                setShowSuggestions(false);
                setSelectedIndex(-1);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="bg-white rounded-full p-1 shadow-lg w-full max-w-md mx-auto">
            <div className="flex flex-row items-center w-full">

                {/* Location Input */}
                <div ref={inputRef}
                    className="flex-1 px-3 md:px-4 flex flex-col relative">
                    <div className="flex flex-1 items-center gap-3">
                        <MapPin className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-black/60" />
                        <input
                            type="text"
                            value={location}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="WHERE TO?"
                            className="w-full border-0 outline-none bg-transparent text-vngo-normal-medium"
                        />

                        {/* See All Trigger */}
                        <div
                            className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-full transition-colors group"
                            onClick={handleShowAll}
                            title="Show all available locations"
                        >
                            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap hidden md:group-hover:block transition-all duration-200">See all</span>
                            <ChevronDown className="w-6 h-6 text-gray-500" />
                        </div>

                        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && ( //&& filteredDestinations.length > 0 && (
                        <ul className="absolute top-full left-10 right-0 bg-white border border-gray-200 rounded-md shadow-md mt-1 max-h-48 overflow-y-auto z-10">
                            {filteredDestinations.length > 0 ? (
                                filteredDestinations.map((dest, index) => (
                                    <li
                                        key={index}
                                        className={`px-3 py-2 cursor-pointer text-vngo-normal-medium text-start ${index === selectedIndex ? "bg-blue-100" : "hover:bg-blue-100"
                                            }`}
                                        onClick={() => handleSelectSuggestion(dest)}
                                        onMouseEnter={() => setSelectedIndex(index)} // Optional: sync mouse hover
                                    >
                                        {/* {dest.province_en} */}
                                        {dest.province_en.replace(/\b(City|Province)\b/gi, "").trim()}
                                    </li>
                                ))
                            ) : (
                                // Hiện "No results"
                                <li className="px-3 py-2 text-gray-500 italic text-vngo-normal-medium text-start">
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
                    className="
                      btn-vngo-gradient-primary
                      w-12 h-12
                      rounded-full 
                      flex items-center justify-center 
                      mr-1
                    "
                >
                    {/* <span className="flex items-center justify-center gap-2">
                    <span className="hidden md:inline">Search</span>
                    <span className="md:hidden">Go</span>
                  </span> */}
                    <Search className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}