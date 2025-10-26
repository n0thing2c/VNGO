import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TourCreate from "./pages/TourCreate.jsx";
import "./index.css"
import { Toaster } from "sonner";
createRoot(document.getElementById('root')).render(
  <StrictMode>
      <div className="h-screen w-screen bg-gray-50">
          <TourCreate/>
          <Toaster position="top-center" richColors />
      </div>

  </StrictMode>,
)
