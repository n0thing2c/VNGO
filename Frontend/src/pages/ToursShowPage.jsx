import {useState, useEffect} from 'react';
import {Search, MapPin, Calendar, Users, Star, Filter, Heart, X, Sparkles, RefreshCw} from 'lucide-react';
import {Card, CardContent} from '../components/ui/card';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Badge} from '../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "../components/ui/dialog";
import {Slider} from "../components/ui/slider";
import {RadioGroup, RadioGroupItem} from "../components/ui/radio-group";
import {Checkbox} from "../components/ui/checkbox";
import {Label} from "../components/ui/label";
import {Link} from "react-router-dom";
import {useSearchParams} from 'react-router-dom'; // read params

// Base URL của API
const API_URL = 'http://127.0.0.1:8000/api'; // <-- THAY BẰNG URL CỦA BẠN

// Bỏ mockTours đi

const ToursShowPage = () => {
    // LẤY searchParams TỪ URL
    const [searchParams] = useSearchParams();

    // --- State cho Data từ API ---
    const [tours, setTours] = useState([]);
    const [locations, setLocations] = useState([]);
    const [filterOptions, setFilterOptions] = useState({tags: [], transportation: []});
    const [isLoading, setIsLoading] = useState(false);

    // --- State cho Filter cơ bản ---
    const [searchTerm, setSearchTerm] = useState('');
    // const [selectedLocation, setSelectedLocation] = useState('');
    // Khởi tạo 'selectedLocation' với giá trị từ URL (nếu có), nếu không thì là string rỗng
    const [selectedLocation, setSelectedLocation] = useState(
        searchParams.get('location') || ''
    );

    // --- State cho Filter nâng cao ---
    const defaultFilters = {
        price: [0, 10000000], // 0 - 50 triệu
        duration: [1, 24],     // 0 - 14 ngày
        groupSize: 1,
        rating: 0,           // 0 = All
        transportation: [],  // array rỗng
        tags: [],            // array rỗng
    };

    // State filter ĐANG ÁP DỤNG (dùng để fetch API)
    const [filters, setFilters] = useState(defaultFilters);

    // State filter TẠM THỜI (dùng trong Dialog)
    const [tempFilters, setTempFilters] = useState(defaultFilters);

    const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

    // --- State khác ---
    //const [favorites, setFavorites] = useState(new Set());
    const [currency, setCurrency] = useState("USD"); // VND or USD
    const exchangeRate = 25000; // 1 VND ≈ 0.000043 USD (update as needed)

    // --- Hàm Format ---
    const formatPrice = (price) => {
        if (currency === "VND") {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(price);
        } else {
            return `$${(price / exchangeRate).toFixed(2)}`;
        }
    };


    // --- Fetch Data ban đầu (Locations & Filter Options) ---
    useEffect(() => {
        // 1. Fetch locations
        fetch(`${API_URL}/places/all/`)
            .then(res => res.json())
            .then(data => setLocations(data.map(p => ({id: p.id, name: p.name, name_en: p.name_en}))))
            .catch(err => console.error("Error fetching locations:", err));

        // 2. Fetch filter options
        fetch(`${API_URL}/filter-options/`)
            .then(res => res.json())
            .then(data => setFilterOptions(data))
            .catch(err => console.error("Error fetching filter options:", err));
    }, []); // [] = chạy 1 lần

    // --- Fetch Tours (khi filter thay đổi) ---
    useEffect(() => {
        setIsLoading(true);
        const params = new URLSearchParams();

        // Filter cơ bản
        if (searchTerm) params.append('search', searchTerm);
        if (selectedLocation) params.append('location', selectedLocation);

        // Filter nâng cao từ state 'filters'
        if (filters.price[0] > 0) params.append('price_min', filters.price[0]);
        if (filters.price[1] < 50000000) params.append('price_max', filters.price[1]);

        if (filters.duration[0] > 0) params.append('duration_min', filters.duration[0]);
        if (filters.duration[1] < 14) params.append('duration_max', filters.duration[1]);

        if (filters.groupSize > 1) params.append('group_size', filters.groupSize);
        if (filters.rating > 0) params.append('rating_min', filters.rating);

        if (filters.transportation.length > 0) params.append('transportation', filters.transportation.join(','));
        if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));

        // Gọi API
        console.log("Fetching with params:", params.toString());
        fetch(`${API_URL}/tour/get/all/?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setTours(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching tours:", err);
                setIsLoading(false);
            });

    }, [searchTerm, selectedLocation, filters]); // Re-fetch khi các filter này thay đổi

    // --- Các hàm xử lý Filter ---

    const handleApplyFilters = () => {
        setFilters(tempFilters); // Áp dụng filter
        setIsFilterDialogOpen(false); // Đóng dialog
    };

    const handleClearFilters = () => {
        setFilters(defaultFilters);
        setTempFilters(defaultFilters);
        // Bạn có thể chọn clear cả searchTerm và selectedLocation ở đây nếu muốn
        // setSearchTerm('');
        // setSelectedLocation('');
    };

    // Hàm xử lý khi check/uncheck 1 checkbox (tags, transportation)
    const handleCheckboxChange = (group, value) => {
        setTempFilters(prev => {
            const currentValues = prev[group]; // vd: prev.tags
            const newValues = currentValues.includes(value)
                ? currentValues.filter(item => item !== value) // Bỏ check
                : [...currentValues, value]; // Thêm check
            return {...prev, [group]: newValues};
        });
    };

    // --- Render ---
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* --- Search Bar --- */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                            <Input
                                type="text"
                                placeholder="Search for tours, locations,..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-12"
                            />
                        </div>

                        {/* Location Filter */}
                        <div className="lg:w-64">
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="w-full h-12 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Places</option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.name_en}>{loc.name_en.split(',')[0]}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- Quick Filters & Dialog Trigger --- */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                    {/* Nút mở Dialog Filter */}
                    <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="h-10 px-6">
                                <Filter className="w-4 h-4 mr-2"/>
                                All filters
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Detailed Filters</DialogTitle>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4">
                                {/* 1. Price Range */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <Label>Price Range ({currency})</Label>
                                        <button
                                            className="rounded-full bg-neutral-50 hover:bg-gray-200 transition-colors"
                                            onClick={() => setCurrency(prev => prev === "VND" ? "USD" : "VND")}
                                        >
                                            <RefreshCw className="w-3 h-3 text-black"/>
                                        </button>
                                    </div>

                                    <Slider
                                        value={tempFilters.price}
                                        onValueChange={(value) => setTempFilters(prev => ({...prev, price: value}))}
                                        min={0}
                                        max={10000000}
                                        step={100000}
                                    />

                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>{formatPrice(tempFilters.price[0], currency)}</span>
                                        <span>{formatPrice(tempFilters.price[1], currency)}</span>
                                    </div>

                                </div>


                                {/* 2. Duration */}
                                <div className="space-y-3">
                                    <Label>Duration (hours)</Label>
                                    <Slider
                                        value={tempFilters.duration}
                                        onValueChange={(value) => setTempFilters(prev => ({...prev, duration: value}))}
                                        min={1}
                                        max={24}
                                        step={1}
                                    />
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>{tempFilters.duration[0]} hours</span>
                                        <span>{tempFilters.duration[1]} hours</span>
                                    </div>
                                </div>

                                {/* 3. Rating */}
                                <div className="space-y-3">
                                    <Label>Ratings</Label>
                                    <RadioGroup
                                        value={String(tempFilters.rating)}
                                        onValueChange={(value) => setTempFilters(prev => ({
                                            ...prev,
                                            rating: Number(value)
                                        }))}
                                    >
                                        {[4, 3, 2, 1, 0].map(star => (
                                            <div key={star} className="flex items-center space-x-2">
                                                <RadioGroupItem value={String(star)} id={`r-${star}`}/>
                                                <Label htmlFor={`r-${star}`} className="font-normal">
                                                    {star > 0 ? `Above ${star} stars` : "All"}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* 4. Group Size */}
                                <div className="space-y-3">
                                    <Label>Group Size</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={15}
                                        value={tempFilters.groupSize}
                                        onChange={(e) => setTempFilters(prev => ({
                                            ...prev,
                                            groupSize: Number(e.target.value) || 1
                                        }))}
                                        className="text-center"
                                        placeholder="Bạn đi bao nhiêu người?"
                                    />
                                </div>

                                {/* 5. Transportation */}
                                <div className="space-y-3 col-span-1 md:col-span-2">
                                    <Label>Transit</Label>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {filterOptions.transportation.map(opt => (
                                            <div key={opt.value} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`trans-${opt.value}`}
                                                    checked={tempFilters.transportation.includes(opt.value)}
                                                    onCheckedChange={() => handleCheckboxChange('transportation', opt.value)}
                                                />
                                                <Label htmlFor={`trans-${opt.value}`}
                                                       className="font-normal">{opt.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 6. Tags (Interests) */}
                                <div className="space-y-3 col-span-1 md:col-span-2">
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {filterOptions.tags.map(tag => (
                                            <div key={tag} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`tag-${tag}`}
                                                    checked={tempFilters.tags.includes(tag)}
                                                    onCheckedChange={() => handleCheckboxChange('tags', tag)}
                                                />
                                                <Label htmlFor={`tag-${tag}`}
                                                       className="font-normal capitalize">{tag}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            <DialogFooter>
                                <Button variant="ghost" onClick={handleClearFilters}>Remove All</Button>
                                <Button onClick={handleApplyFilters}>Apply</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Nút Clear All (bên ngoài) */}
                    <Button variant="ghost" onClick={handleClearFilters} className="text-gray-600">
                        <X className="w-4 h-4 mr-2"/>
                        Clear Filters
                    </Button>

                    {/* Quick Filter: Tags (Ví dụ) */}
                    {/* Bạn có thể thêm các nút quick filter cho tags ở đây nếu muốn */}
                    {/* <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({...prev, tags: ['food']}))}>
            <Sparkles className="w-4 h-4 mr-2" />
            Tour ẩm thực
          </Button> */}

                </div>

                {/* --- Results Count --- */}
                <div className="flex justify-between items-center mb-6">
                    <p className="text-gray-600">
                        {isLoading
                            ? "Searching..."
                            : `${tours.length} tous found`
                        }
                    </p>
                </div>

                {/* --- Tours Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tours.map((tour) => (
                        <Card key={tour.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <div className="relative">
                                <img
                                    src={tour.image}
                                    alt={tour.title}
                                    className="w-full h-48 object-cover"
                                />
                                {/*<button*/}
                                {/*  onClick={() => toggleFavorite(tour.id)}*/}
                                {/*  className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"*/}
                                {/*>*/}
                                {/*  <Heart*/}
                                {/*    className={`w-5 h-5 ${*/}
                                {/*      favorites.has(tour.id) ? 'text-red-500 fill-current' : 'text-gray-400'*/}
                                {/*    }`}*/}
                                {/*  />*/}
                                {/*</button>*/}
                                {/* Hiển thị duration từ model (integer) */}
                                <Badge className="absolute top-3 left-3 bg-white text-gray-800">
                                    {tour.duration} hours
                                </Badge>
                            </div>

                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-3">
                                    {tour.title}
                                </h3>

                                <div className="flex items-center text-gray-600 mb-3">
                                      <span className="flex-shrink-0">
                                        <MapPin className="w-4 h-4 mr-1"/>
                                      </span>
                                    <span className="text-sm">{tour.location}</span>
                                </div>


                                <div className="flex items-center text-gray-600 mb-4">
                                    <Users className="w-4 h-4 mr-1"/>
                                    <span className="text-sm">{tour.groupSize}</span>
                                </div>

                                {/* --- HIỂN THỊ RATING THẬT --- */}
                                <div className="flex items-center mb-4">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${
                                                    i < Math.round(tour.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600 ml-2">
                                        {tour.rating.toFixed(1)} ({tour.reviews} ratings)
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-2xl font-bold text-blue-600">
                                          {formatPrice(tour.price)}
                                        </span>
                                        <span className="text-sm text-gray-600 ml-1">/people</span>
                                    </div>
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        <Link to={`/tour/post/${tour.id}`}>View details</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* No Results */}
                {!isLoading && tours.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <Search className="w-16 h-16 mx-auto"/>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No tour matches
                        </h3>
                        <p className="text-gray-600">
                            Try changing location or using filters
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToursShowPage;