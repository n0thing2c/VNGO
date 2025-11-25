// src/pages/ManagementTours.jsx
import { useAuthStore } from "@/stores/useAuthStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookingList from "@/components/management/BookingList";
import IncomingRequests from "@/components/management/IncomingRequests";
import PastTours from "@/components/management/PastTours";
import MyToursList from "@/components/management/MyToursList";
import { useState, useEffect } from "react";
import { managementService } from "@/services/managementService";
import { tourService } from "@/services/tourService";
import BookingCardSkeleton from "@/components/management/BookingCardSkeleton";

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

  const isGuide = managementData.role === "guide";

  useEffect(() => {
    const fetchManagementData = async () => {
      setIsLoading(true);
      const result = await managementService.getManagementSnapshot();
      
      if (result.success) {
        setManagementData(result.data);
        
        // If user is a guide, also fetch their tours
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

  // Refresh data function để truyền vào các component con
  const refreshData = async () => {
    const result = await managementService.getManagementSnapshot();
    if (result.success) {
      setManagementData(result.data);
      
      // Also refresh tours if guide
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
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-8 py-6 border-b">
            <Tabs defaultValue={isGuide ? "my-tours" : "bookings"} className="w-full">
              <TabsList className={`grid w-full max-w-2xl mx-auto h-14 rounded-full bg-white p-1 shadow-sm ${isGuide ? 'grid-cols-3' : 'grid-cols-2'}`}>
                
                {/* ===== TOURIST: 2 tab ===== */}
                {!isGuide && (
                  <>
                    <TabsTrigger value="bookings" className="rounded-full data-[state=active]:bg-green-600 data-[state=active]:text-white">
                      My bookings
                    </TabsTrigger>
                    <TabsTrigger value="past-tours" className="rounded-full data-[state=active]:bg-green-600 data-[state=active]:text-white">
                      Past tours
                    </TabsTrigger>
                  </>
                )}

                {/* ===== GUIDE: 3 tab ===== */}
                {isGuide && (
                  <>
                    <TabsTrigger value="my-tours" className="rounded-full data-[state=active]:bg-green-600 data-[state=active]:text-white">
                      My Tours
                    </TabsTrigger>
                    <TabsTrigger value="incoming" className="rounded-full data-[state=active]:bg-green-600 data-[state=active]:text-white">
                      Incoming requests
                    </TabsTrigger>
                    <TabsTrigger value="past-tours" className="rounded-full data-[state=active]:bg-green-600 data-[state=active]:text-white">
                      Past tours
                    </TabsTrigger>
                  </>
                )}

              </TabsList>

              {/* ===== NỘI DUNG ===== */}
              {!isGuide && (
                <>
                  <TabsContent value="bookings" className="p-8">
                    <BookingList bookings={managementData.bookings} refreshData={refreshData} />
                  </TabsContent>
                  <TabsContent value="past-tours" className="p-8">
                    <PastTours role="tourist" pastTours={managementData.pastTours} />
                  </TabsContent>
                </>
              )}

              {isGuide && (
                <>
                  <TabsContent value="my-tours" className="p-8">
                    <MyToursList tours={myTours} />
                  </TabsContent>
                  <TabsContent value="incoming" className="p-8">
                    <IncomingRequests incomingRequests={managementData.incomingRequests} refreshData={refreshData} />
                  </TabsContent>
                  <TabsContent value="past-tours" className="p-8">
                    <PastTours role="guide" pastTours={managementData.pastTours} />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>

        </div>
      </div>
    </div>
  );
}