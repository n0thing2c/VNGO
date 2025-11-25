// src/pages/ManagementTours.jsx
import { useAuthStore } from "@/stores/useAuthStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookingList from "@/components/management/BookingList";
import IncomingRequests from "@/components/management/IncomingRequests";
import PastTours from "@/components/management/PastTours";

export default function ManagementTours() {
  // const { user } = useAuthStore();
  // const isGuide = user?.roles?.includes("guide");
  const isGuide = true; // ← FAKE GUIDE MODE - xóa dòng này khi test xong

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-8 py-6 border-b">
            <Tabs defaultValue={isGuide ? "incoming" : "bookings"} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto h-14 rounded-full bg-white p-1 shadow-sm grid-cols-2">
                
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

                {/* ===== GUIDE: 2 tab khác ===== */}
                {isGuide && (
                  <>
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
                    <BookingList />
                  </TabsContent>
                  <TabsContent value="past-tours" className="p-8">
                    <PastTours role="tourist" />
                  </TabsContent>
                </>
              )}

              {isGuide && (
                <>
                  <TabsContent value="incoming" className="p-8">
                    <IncomingRequests />
                  </TabsContent>
                  <TabsContent value="past-tours" className="p-8">
                    <PastTours role="guide" />
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