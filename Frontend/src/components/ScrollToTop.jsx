import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  // Lấy ra "pathname" (ví dụ: "/tours" hoặc "/")
  const { pathname } = useLocation();

  // Chạy một effect mỗi khi "pathname" thay đổi
  useEffect(() => {
    // Cuộn cửa sổ trình duyệt về vị trí (0, 0)
    window.scrollTo(0, 0);
  }, [pathname]); // <-- Dependency là pathname

  // Component này không render ra gì cả
  return null;
}

export default ScrollToTop;