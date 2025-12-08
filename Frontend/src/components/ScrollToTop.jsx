import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  // Get "pathname" (e.g., "/tours" or "/")
  const { pathname } = useLocation();

  // Run an effect whenever "pathname" changes
  useEffect(() => {
    // Scroll browser window to position (0, 0)
    window.scrollTo(0, 0);
  }, [pathname]); // <-- Dependency is pathname

  // This component doesn't render anything
  return null;
}

export default ScrollToTop;