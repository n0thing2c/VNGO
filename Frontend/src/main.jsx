import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Map from "./components/Map.jsx";
import TextInput from "./components/TextInput.jsx";
import TourCreate from "./pages/TourCreate.jsx";
import "./index.css"
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TourCreate/>
  </StrictMode>,
)
