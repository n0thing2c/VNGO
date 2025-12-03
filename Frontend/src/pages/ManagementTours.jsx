// src/pages/ManagementTours.jsx
import { useAuthStore } from "@/stores/useAuthStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BookingList from "@/components/management/BookingList";
import IncomingRequests from "@/components/management/IncomingRequests";
import PastTours from "@/components/management/PastTours";
import MyToursList from "@/components/management/MyToursList";
import { useState, useEffect } from "react";
import { managementService } from "@/services/managementService";
import { tourService } from "@/services/tourService";
import BookingCardSkeleton from "@/components/management/BookingCardSkeleton";
import { Globe, Compass, Clock } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("bookings"); // Thêm dòng này

  useEffect(() => {
    const fetchManagementData = async () => {
      setIsLoading(true);
      const result = await managementService.getManagementSnapshot();
      
      if (result.success) {
        setManagementData(result.data);
        setActiveTab(result.data.role === "guide" ? "my-tours" : "bookings"); // Set tab đúng ngay khi có role
        
        if (result.data.role === "guide") {
          const toursResult = await tourService.getMyTours();
          if (toursResult.success) {
            setMyTours(toursResult.data);
          }
        }
      }
      
      setIsLoading(false);
    };

    if (user) {
      fetchManagementData();
    }
  }, [user]);

  const refreshData = async () => {
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

      {/* THẺ 1: TabsList*/}
      
      <div className="bg-white rounded-4xl shadow-lg overflow-hidden">
        <div className="px-8 pt-8 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`flex items-center gap-6 mx-0 ${
              managementData.role === 'guide' ? 'justify-start' : 'justify-start'
            }`}>
              {managementData.role === 'guide' ? (
                <>
                  <TabsTrigger value="my-tours" className="data-[state=active]:text-green-700 min-w-[96px]">
                    <Compass className="h-5 w-5" />
                    My Tours
                  </TabsTrigger>
                  <TabsTrigger value="incoming" className="data-[state=active]:text-green-700 min-w-[96px]">
                    <Globe className="h-5 w-5" />Incoming requests
                  </TabsTrigger>
                  <TabsTrigger value="past-tours" className="data-[state=active]:text-green-700 min-w-[96px]">
                    <Clock className="h-5 w-5" />Past tours
                  </TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="bookings" className="data-[state=active]:text-green-700 min-w-[96px]">
                    <Globe className="h-5 w-5" />My bookings
                  </TabsTrigger>
                  <TabsTrigger value="past-tours" className="data-[state=active]:text-green-700 min-w-[96px]">
                    <Clock className="h-5 w-5" />Past tours
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* THẺ 2: Nội dung */}
      <div className="bg-white rounded-4xl shadow-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="p-8 pt-10 min-h-[600px]">
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