import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from "./App.jsx";
import "./index.css"
import logo from "./assets/LogoVNGO.png"

// Set favicon from assets
const setFavicon = (iconPath) => {
  const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/png';
  link.rel = 'icon';
  link.href = iconPath;
  document.getElementsByTagName('head')[0].appendChild(link);
  
  // Set apple-touch-icon for mobile
  const appleLink = document.querySelector("link[rel*='apple-touch-icon']") || document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = iconPath;
  document.getElementsByTagName('head')[0].appendChild(appleLink);
};

setFavicon(logo);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
