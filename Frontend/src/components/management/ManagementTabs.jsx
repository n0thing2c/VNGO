import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/useAuthStore";

export default function ManagementTabs({ defaultValue, onValueChange }) {
  const { user } = useAuthStore();
  const isGuide = user?.roles?.includes("guide");

  return (
    <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
      <Tabs value={defaultValue} onValueChange={onValueChange} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-14 rounded-full bg-white p-1 shadow-sm">
          <TabsTrigger
            value="bookings"
            className="rounded-full data-[state=active]:bg-green-600 data-[state=active]:text-white text-base font-medium"
          >
            My bookings
          </TabsTrigger>

          {isGuide && (
            <TabsTrigger
              value="mytours"
              className="rounded-full data-[state=active]:bg-green-600 data-[state=active]:text-white text-base font-medium"
            >
              My tours
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
}