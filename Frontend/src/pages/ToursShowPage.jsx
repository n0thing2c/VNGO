import {useState, useEffect} from 'react';
import {Search, Filter, X, RefreshCw} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "../components/ui/dialog";
import {Slider} from "../components/ui/slider";
import {RadioGroup, RadioGroupItem} from "../components/ui/radio-group";
import {Checkbox} from "../components/ui/checkbox";
import {Label} from "../components/ui/label";
import {useSearchParams} from 'react-router-dom'; // read params
import TourCard from '@/components/TourCard';
import {getProvinceImage} from '@/utils/provinceImages';

// API
import {API_ENDPOINTS} from "@/constant";
import SortSelect from "@/components/sortbutton.jsx";

const ToursShowPage = () => {
    // LẤY searchParams TỪ URL
    const [searchParams] = useSearchParams();
    // Đọc các param từ URL khi component mount
    const searchTermFromUrl = searchParams.get('search') || '';
    const locationFromUrl = searchParams.get('location') || '';

    // --- State cho Data từ API ---
    const [tours, setTours] = useState([]);
    const [locations, setLocations] = useState([]);
    const [filterOptions, setFilterOptions] = useState({tags: [], transportation: []});
    const [isLoading, setIsLoading] = useState(false);

    // State cho search/location (đồng bộ với URL)
    const [searchTerm, setSearchTerm] = useState(searchTermFromUrl);
    const [selectedLocation, setSelectedLocation] = useState(locationFromUrl);

    // --- State cho Filter nâng cao ---
    const defaultFilters = {
        price: [0, 10000000], // 0 - 10 triệu
        duration: [1, 24],     // 0 - 24 giờ
        groupSize: 0,
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

    // // Thêm tiêu đề cho Hero
    // const heroTitle = searchTerm || selectedLocation || "Discover All Tours";

    // State cho ảnh hero
    const [heroImage, setHeroImage] = useState(getProvinceImage('')) // Lấy ảnh default ban đầu

    //Sorting
    const SORT_OPTIONS = [
        {field: 'default', label: 'Default', defaultDirection: 'asc'},
        {field: 'price', label: 'Price', defaultDirection: 'asc'},
        {field: 'duration', label: 'Duration', defaultDirection: 'asc'},
        {field: 'rating', label: 'Rating', defaultDirection: 'desc'}, // top rated first
    ];
    const [sort, setSort] = useState('');

    // --- Hàm Format ---
    const formatPrice = (price) => {
        if (currency === "VND") {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(price);
        } else {
            return `$${(price / exchangeRate).toFixed(0)}`; // Show whole dollars
        }
    };


    // --- Fetch Data ban đầu (Locations & Filter Options) ---
    useEffect(() => {
        // 1. Fetch locations
        fetch(API_ENDPOINTS.GET_ALL_PROVINCES)
            .then(res => res.json())
            .then(data => setLocations(data))
            .catch(err => console.error("Error fetching locations:", err));

        // 2. Fetch filter options
        fetch(API_ENDPOINTS.GET_FILTER_OPTIONS)
            .then(res => res.json())
            .then(data => setFilterOptions(data))
            .catch(err => console.error("Error fetching filter options:", err));
    }, []); // [] = chạy 1 lần

    // Đồng bộ state với URL params khi URL thay đổi VÀ set ảnh hero
    useEffect(() => {
        const currentSearch = searchParams.get('search') || '';
        const currentLocation = searchParams.get('location') || '';

        setSearchTerm(currentSearch);
        setSelectedLocation(currentLocation);

        const query = currentSearch || currentLocation;
        setHeroImage(getProvinceImage(query));
    }, [searchParams]); // Hook chạy mỗi khi URL param thay đổi

    // --- Fetch Tours (khi filter thay đổi) ---
    useEffect(() => {
        setIsLoading(true);
        const params = new URLSearchParams();

        // Filter cơ bản
        if (searchTerm) params.append('search', searchTerm);
        if (selectedLocation) params.append('location', selectedLocation);

        // Filter nâng cao từ state 'filters'
        if (filters.price[0] > 0) params.append('price_min', filters.price[0]);
        if (filters.price[1] < 10000000) params.append('price_max', filters.price[1]); // Sửa 50tr thành 10tr cho khớp defaultFilters

        if (filters.duration[0] > 1) params.append('duration_min', filters.duration[0]);
        if (filters.duration[1] < 24) params.append('duration_max', filters.duration[1]);

        if (filters.groupSize > 0) params.append('group_size', filters.groupSize);
        if (filters.rating > 0) params.append('rating_min', filters.rating);

        if (filters.transportation.length > 0) params.append('transportation', filters.transportation.join(','));
        if (filters.tags.length > 0) params.append('tags', filters.tags.join(','));

        //Sort
        if (sort) params.append('sort', sort);

        // Gọi API
        console.log("Fetching with params:", params.toString());
        fetch(`${API_ENDPOINTS.GET_ALL_TOURS}?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setTours(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching tours:", err);
                setIsLoading(false);
            });

    }, [searchTerm, selectedLocation, filters, sort]); // Re-fetch khi các filter này thay đổi

    // --- Các hàm xử lý Filter ---

    const handleApplyFilters = () => {
        setFilters(tempFilters); // Áp dụng filter
        setIsFilterDialogOpen(false); // Đóng dialog
    };

    const handleClearFilters = () => {
        setFilters(defaultFilters);
        setTempFilters(defaultFilters);
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
            {/* --- Hero Section --- */}
            <div className="relative w-full h-48 md:h-64 bg-gray-800">
                <img
                    src={heroImage || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"}
                    alt="Scenic view"
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    {/* <h1 className="text-3xl md:text-5xl font-bold text-white text-center px-4 capitalize">
                        {heroTitle}
                    </h1> */}
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                        min={0}
                                        max={15}
                                        value={tempFilters.groupSize}
                                        onChange={(e) => setTempFilters(prev => ({
                                            ...prev,
                                            groupSize: Number(e.target.value) || 0
                                        }))}
                                        className="text-center"
                                        placeholder="How many people?"
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

                    <div className="flex items-center gap-2 ml-auto">
                      <span className="font-normal">Sort by:</span>
                      <SortSelect sort={sort} setSort={setSort} options={SORT_OPTIONS} />
                    </div>




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
                            : `${tours.length} tours found`
                        }
                    </p>
                </div>

                {/* --- Tours Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tours.map((tour) => (
                        <TourCard key={tour.id} tour={tour}/>
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