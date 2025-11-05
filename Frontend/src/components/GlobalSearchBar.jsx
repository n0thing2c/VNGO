import {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {MapPin} from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

export default function GlobalSearchBar() {
    const [location, setLocation] = useState("");
    const [destinations, setDestinations] = useState([]);
    const [filteredDestinations, setFilteredDestinations] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    // Fetch destinations
    useEffect(() => {
        fetch(`${API_URL}/places/all/`)
            .then(res => res.json())
            .then(data => {
                setDestinations(data.map(p => ({name_en: p.name_en, name: p.name})));
            })
            .catch(err => console.error("Error fetching locations:", err));
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setLocation(value);

        // Only suggest if at least one word is typed
        if (value.trim().split(' ').filter(Boolean).length >= 2) {
            const filtered = [];
            const lowerValue = value.toLowerCase();
            const seen = new Set();

            destinations.forEach(dest => {
                ["name_en", "name"].forEach(key => {
                    const text = dest[key];
                    const index = text.toLowerCase().indexOf(lowerValue);
                    if (index !== -1) {
                        const commaIndex = text.indexOf(',', index);
                        const suggestion = commaIndex !== -1
                            ? text.slice(index, commaIndex).trim()
                            : text.slice(index).trim();

                        if (!seen.has(suggestion)) {
                            seen.add(suggestion);
                            filtered.push(suggestion);
                        }
                    }
                });
            });

            setFilteredDestinations(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };


    const handleSelectSuggestion = (name) => {
        setLocation(name);
        setShowSuggestions(false);
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.append('location', location);
        navigate(`/tours?${params.toString()}`);
    };

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
        <div className="bg-white rounded-full p-1 shadow-lg w-full max-w-2xl mx-auto">
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
                            placeholder="WHERE TO?"
                            className="w-full border-0 outline-none bg-transparent text-sm"
                        />
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && filteredDestinations.length > 0 && (
                        <ul className="absolute top-full left-10 right-0 bg-white border border-gray-200 rounded-md shadow-md mt-1 max-h-48 overflow-y-auto z-10">
                            {filteredDestinations.map((dest, index) => (
                                <li
                                    key={index}
                                    className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm text-start"
                                    onClick={() => handleSelectSuggestion(dest)}
                                >
                                    {dest}
                                </li>
                            ))}
                        </ul>
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
                <button
                    onClick={handleSearch}
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
