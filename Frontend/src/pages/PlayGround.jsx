// src/pages/Playground.jsx

import AlbumPhotoFrame from "@/components/albumframes"
// import AnimatedStat from "@/components/AnimatedStat"
import DragList from "@/components/drag_list"
// import FadeInWrapper from "@/components/FadeInWrapper"
import ImageUploader from "@/components/imageuploader"
import VNDInput from "@/components/priceinput"
import TagSelector from "@/components/tagsselector"
import TourCard from "@/components/TourCard"


import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar22 } from "@/components/ui/datepicker"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport
} from "@/components/ui/navigation-menu"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { AlertCircle, CalendarIcon, Menu } from "lucide-react"
import { useState } from "react"

export default function Playground() {
  const [open, setOpen] = useState(false)

  return (
    <div className="container mx-auto p-8 space-y-12">
      <h1 className="text-4xl font-bold text-center">Playground – đúng 100% import của bạn</h1>

      <Button onClick={() => setOpen(true)}>Mở Dialog</Button>

      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Trigger trong Dialog</Button>
        </DialogTrigger>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>Dialog Description</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>Alert Description</AlertDescription>
      </Alert>

      <Calendar />

      <Checkbox id="test" />
      <Label htmlFor="test">Checkbox Label</Label>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Menu className="mr-2 h-4 w-4" /> Dropdown
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Select>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Chọn" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>

      <Separator />

      <Slider defaultValue={[33]} max={100} step={1} className="w-64" />

      <Textarea placeholder="Textarea" />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Popover</Button>
        </PopoverTrigger>
        <PopoverContent>Popover Content</PopoverContent>
      </Popover>

      <Command>
        <CommandInput placeholder="Tìm kiếm..." />
        <CommandList>
          <CommandEmpty>Không tìm thấy</CommandEmpty>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>

      <RadioGroup defaultValue="option1">
        <RadioGroupItem value="option1" id="r1" />
        <Label htmlFor="r1">Option 1</Label>
      </RadioGroup>

      <Calendar22/>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink>Link</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <Carousel className="w-full max-w-xs">
        <CarouselContent>
          <CarouselItem><div className="bg-red-200 h-40" /></CarouselItem>
          <CarouselItem><div className="bg-blue-200 h-40" /></CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <section className="py-12">
        <h2 className="text-3xl font-bold mb-6">AlbumPhotoFrame</h2>
        <AlbumPhotoFrame
          images={[
            "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400",
            "https://images.unsplash.com/photo-1497436072909-60f6c1a3b2f1?w=400",
            "https://images.unsplash.com/photo-1519046902490-05a36ab0e51a?w=400",
          ]}
        />
      </section>

      {/* 2. AnimatedStat
      <section className="py-12 bg-gray-900 text-white rounded-2xl">
        <h2 className="text-3xl font-bold mb-8 text-center">AnimatedStat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <AnimatedStat end={128} suffix="+" label="Tours đã đặt" />
          <AnimatedStat end={89} suffix="%" label="Hài lòng" />
          <AnimatedStat end={450} prefix="₫" suffix="M" label="Doanh thu" />
          <AnimatedStat end={12} suffix="k" label="Khách hàng" />
        </div>
      </section> */}

      {/* 3. DragList */}
      <section className="py-12">
        <h2 className="text-3xl font-bold mb-6">DragList (kéo thả thứ tự)</h2>
        <DragList />
      </section>

      {/* 4. FadeInWrapper
      <section className="py-12">
        <h2 className="text-3xl font-bold mb-6">FadeInWrapper (hiệu ứng xuất hiện)</h2>
        <FadeInWrapper>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-16 rounded-3xl text-center text-2xl font-bold">
            Tôi hiện ra mượt mà lắm nè!
          </div>
        </FadeInWrapper>
      </section> */}

      {/* 5. ImageUploader */}
      <section className="py-12">
        <h2 className="text-3xl font-bold mb-6">ImageUploader</h2>
        <div className="max-w-md">
          <ImageUploader onUpload={(files) => console.log("Uploaded:", files)} />
        </div>
      </section>

      {/* 6. VNDInput (Price Input) */}
      <section className="py-12">
        <h2 className="text-3xl font-bold mb-6">VNDInput – Nhập giá tiền</h2>
        <div className="max-w-xs space-y-4">
          <VNDInput label="Giá tour" placeholder="Nhập giá tiền" />
          <VNDInput label="Giá đã giảm" defaultValue={2500000} />
        </div>
      </section>

      {/* 7. TagSelector */}
      <section className="py-12">
        <h2 className="text-3xl font-bold mb-6">TagSelector</h2>
        <div className="max-w-lg">
          <TagSelector
            availableTags={["Biển", "Núi", "Văn hóa", "Ẩm thực", "Mạo hiểm", "Gia đình"]}
            selectedTags={["Biển", "Ẩm thực"]}
            onChange={(tags) => console.log("Tags:", tags)}
          />
        </div>
      </section>

      {/* 8. TourCard */}
      <section className="py-12">
        <h2 className="text-3xl font-bold mb-6">TourCard (card tour đẹp)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <TourCard
            title="Hạ Long Bay 2N1Đ"
            price={4800000}
            duration="2 ngày 1 đêm"
            rating={4.8}
            reviews={128}
            image="https://images.unsplash.com/photo-1583417319070-4bfb1f6b4c9b?w=800"
            tags={["Biển", "Di sản"]}
          />
          <TourCard
            title="Phú Quốc Sunset"
            price={3200000}
            duration="3 ngày 2 đêm"
            rating={4.9}
            reviews={89}
            image="https://images.unsplash.com/photo-1577717904355-20f7b6f6e48d?w=800"
            tags={["Biển", "Nghỉ dưỡng"]}
            featured
          />
          <TourCard
            title="Sapa Trekking"
            price={2900000}
            duration="4 ngày 3 đêm"
            rating={4.7}
            reviews={203}
            image="https://images.unsplash.com/photo-1506905925346-5008b67a5e3e?w=800"
            tags={["Núi", "Văn hóa"]}
          />
        </div>
      </section>
    </div>
    
  )
}