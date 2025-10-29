import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TourCreate from "./pages/TourCreate.jsx";
import "./index.css"
import { Toaster } from "sonner";
import TourPost from "@/pages/TourPost.jsx";
createRoot(document.getElementById('root')).render(
  <StrictMode>
      <div className="h-screen w-screen bg-gray-50">
          <TourPost tourId={95}/>
          <Toaster position="top-center" richColors />
      </div>

  </StrictMode>,
)
