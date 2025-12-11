// src/pages/ManagementTours.jsx
import { useAuthStore } from "@/stores/useAuthStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BookingList from "@/components/management/BookingList";
import IncomingRequests from "@/components/management/IncomingRequests";
import PastTours from "@/components/management/PastToursCard";
import MyToursList from "@/components/management/MyToursList";
import { useState, useEffect } from "react";
import { managementService } from "@/services/managementService";
import { tourService } from "@/services/tourService";
import BookingCardSkeleton from "@/components/management/BookingCardSkeleton";
import { Globe, Compass, Clock, Send } from "lucide-react";

const IS_MOCK_TEST = 0; // Change to FALSE when deploying or testing real API
const TEST_ROLE = "guide"; // Change to "tourist" to test Tourist Tabs

const mockDataTourist = {
  role: "tourist",

  // Data for "My bookings" tab
  bookings: [
    {
      id: 101,
      tourId: "101",
      image: "https://picsum.photos/id/237/300/200", // Replace with actual image
      title: "Ha Long Bay: 3-Day Cruise & Kayaking",
      status: "Confirmed",
      status_key: "confirmed",
      tourDate: "2025-12-20T00:00:00Z",
      tourTime: "07:00 AM",
      number_of_guests: 2,
      totalPrice: 4500000,
      guideName: "Alex Hướng Dẫn", // Tourist needs to see Guide name
      touristName: null,
    },
    {
      id: 102,
      tourId: "102",
      image: "https://picsum.photos/id/160/300/200",
      title: "Sapa Trekking & Local Village Stay",
      status: "Pending Confirmation",
      status_key: "pending",
      tourDate: "2025-12-25T00:00:00Z",
      tourTime: "08:30 AM",
      number_of_guests: 4,
      totalPrice: 8200000,
      guideName: "Bảo Guide",
      touristName: null,
    },
  ],
  incomingRequests: [],
  pastTours: [
    {
      id: 201,
      tourId: "201",
      image: "https://picsum.photos/id/150/300/200",
      title: "Hoi An Lantern Festival Night Tour",
      status: "Completed",
      status_key: "completed",
      tourDate: "2025-11-05T00:00:00Z",
      tourTime: "06:00 PM",
      number_of_guests: 1,
      totalPrice: 950000,
      guideName: "Châu Guide",
      touristName: null,
    },
  ],
};
const mockDataGuide = {
  role: "guide",
  bookings: [],
  incomingRequests: [
    {
      id: 301,
      tourId: "301",
      image: "https://picsum.photos/id/240/300/200",
      title: "Tour ẩm thực Sài Gòn đêm",
      status: "Pending",
      status_key: "pending", // IMPORTANT: to show Accept/Decline buttons
      tourDate: "2025-12-15T00:00:00Z",
      tourTime: "06:30 PM",
      number_of_guests: 3,
      totalPrice: 3000000,
      guideName: null,
      touristName: "Minh Khách Hàng",
    },
    {
      id: 302,
      tourId: "302",
      image: "https://picsum.photos/id/250/300/200",
      title: "Chuyến đi Mũi Né 2 ngày",
      status: "Declined",
      status_key: "declined",
      tourDate: "2025-12-22T00:00:00Z",
      tourTime: "09:00 AM",
      number_of_guests: 1,
      totalPrice: 2100000,
      guideName: null,
      touristName: "Ngọc Khách Hàng",
    },
  ],
  pastTours: mockDataTourist.pastTours,
};

const mockMyTours = [
  {
    id: 'MT-001',
    name: 'City Tour Đà Nẵng', // Some components use 'name'
    title: 'City Tour Đà Nẵng', // Some components use 'title'
    image: "https://picsum.photos/id/101/300/200",
    status: 'Active',
    status_key: 'active',
    price: 5000000, // Add price (important)
    duration: "2",
    max_guests: 15,
    rating: 4.8,
    reviews_count: 12,
    next_departure_date: "2025-01-10T08:00:00Z"
  },
  {
    id: 'MT-002',
    name: 'Đảo Phú Quý 3N2Đ',
    title: 'Đảo Phú Quý 3N2Đ',
    image: "https://picsum.photos/id/102/300/200",
    status: 'Draft',
    status_key: 'draft',
    price: 2500000, // Add price (important)
    duration: "3",
    max_guests: 20,
    rating: 0,
    reviews_count: 0,
    next_departure_date: null
  },
];
const MOCK_MANAGEMENT_DATA = TEST_ROLE === "guide" ? mockDataGuide : mockDataTourist;

export default function ManagementTours() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  const [managementData, setManagementData] = useState({
    role: null,
    bookings: [],
    incomingRequests: [],
    pastTours: [],
  });
  const [myTours, setMyTours] = useState([]);
  const initialTab = IS_MOCK_TEST
    ? (TEST_ROLE === "guide" ? "my-tours" : "bookings")
    : "bookings";
  const [activeTab, setActiveTab] = useState(initialTab);
  // const [activeTab, setActiveTab] = useState("bookings"); // Add this line

  useEffect(() => {
    const fetchManagementData = async () => {
      setIsLoading(true);
      if (IS_MOCK_TEST) {
        // Simulate API delay
        setTimeout(() => {
          setManagementData(MOCK_MANAGEMENT_DATA);

          if (MOCK_MANAGEMENT_DATA.role === "guide") {
            setMyTours(mockMyTours);
            setActiveTab("my-tours");
          } else {
            setActiveTab("bookings");
          }
          setIsLoading(false);
        }, 500);
      }
      else {
        const result = await managementService.getManagementSnapshot();

        if (result.success) {
          setManagementData(result.data);
          setActiveTab(result.data.role === "guide" ? "my-tours" : "bookings"); // Set correct tab as soon as role is available

          if (result.data.role === "guide") {
            const toursResult = await tourService.getMyTours();
            if (toursResult.success) {
              setMyTours(toursResult.data);
            }
          }
        }

        setIsLoading(false);
      }
    };

    if (user || IS_MOCK_TEST) {
      fetchManagementData();
    }
  }, [user]);

  const refreshData = async () => {
    if (IS_MOCK_TEST) {
      return;
    }
    const result = await managementService.getManagementSnapshot();
    if (result.success) {
      setManagementData(result.data);

      if (result.data.role === "guide") {
        const toursResult = await tourService.getMyTours();
        if (toursResult.success) {
          setMyTours(toursResult.data);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-8 py-6 border-b">
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <BookingCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* CARD 1: TabsList */}

        <div className="bg-white rounded-4xl shadow-lg overflow-hidden">
          <div className="px-2 md:px-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`flex items-center gap-2 md:gap-6 mx-0 w-full h-18 overflow-x-auto [&>*]:flex-shrink-0 ${managementData.role === 'guide' ? 'justify-start' : 'justify-start'
                }`}>
                {managementData.role === 'guide' ? (
                  <>
                    <TabsTrigger value="my-tours" className="data-[state=active]:text-[#068F64] min-w-[96px]">
                      <Compass className="h-6 w-7 mr-1" />My Tours
                    </TabsTrigger>
                    <TabsTrigger value="incoming" className="data-[state=active]:text-[#068F64] min-w-[96px]">
                      <Send className="h-6 w-7 mr-1" />Incoming requests
                    </TabsTrigger>
                    <TabsTrigger value="past-tours" className="data-[state=active]:text-[#068F64] min-w-[96px]">
                      <Clock className="h-6 w-7 mr-1" />Past tours
                    </TabsTrigger>
                  </>
                ) : (
                  <>
                    <TabsTrigger value="bookings" className="data-[state=active]:text-[#068F64] min-w-[96px]">
                      <Globe className="h-6 w-7 mr-1" />My bookings
                    </TabsTrigger>
                    <TabsTrigger value="past-tours" className="data-[state=active]:text-[#068F64] min-w-[96px]">
                      <Clock className="h-6 w-7 mr-1" />Past tours
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* CARD 2: Content */}
        <div className="bg-white rounded-4xl shadow-lg overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="p-8 pt-10 min-h-[500px]">
              {managementData.role === 'guide' ? (
                <>
                  {activeTab === "my-tours" && (
                    <MyToursList tours={myTours} refreshData={refreshData} />
                  )}
                  {activeTab === "incoming" && (
                    <IncomingRequests incomingRequests={managementData.incomingRequests} refreshData={refreshData} />
                  )}
                  {activeTab === "past-tours" && (
                    <PastTours role="guide" pastTours={managementData.pastTours} />
                  )}
                </>
              ) : (
                <>
                  {activeTab === "bookings" && (
                    <BookingList bookings={managementData.bookings} refreshData={refreshData} />
                  )}
                  {activeTab === "past-tours" && (
                    <PastTours role="tourist" pastTours={managementData.pastTours} />
                  )}
                </>
              )}
            </div>
          </Tabs>
        </div>

      </div>
    </div>
  );
}