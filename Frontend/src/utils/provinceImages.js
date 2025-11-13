// ẢNH FALLBACK: Dùng khi user tìm kiếm linh tinh
const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';

// BẢN ĐỒ ẢNH: Map các từ khóa (lowercase) với ảnh của bạn
// Hãy thay thế các URL này bằng đường dẫn tới 34 ảnh của bạn
const PROVINCE_IMAGE_MAP = {
  // Miền Bắc
  'hanoi': 'https://images.unsplash.com/photo-1555899434-96d26b0c7446?auto=format&fit=crop&w=1740&q=80',
  'ha long': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1740&q=80',
  'quang ninh': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1740&q=80',
  'sapa': 'https://images.unsplash.com/photo-1588390130026-167883a4c5a9?auto=format&fit=crop&w=1740&q=80',
  'lao cai': 'https://images.unsplash.com/photo-1588390130026-167883a4c5a9?auto=format&fit=crop&w=1740&q=80',
  'ninh binh': 'https://images.unsplash.com/photo-1596263576628-6e530b5e9083?auto=format&fit=crop&w=1740&q=80',
  
  // Miền Trung
  'da nang': 'https://images.unsplash.com/photo-1561570777-2c1b8b63b86a?auto=format&fit=crop&w=1740&q=80',
  'hoi an': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1740&q=80',
  'quang nam': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1740&q=80',
  'hue': 'https://images.unsplash.com/photo-1598404418022-f173f4007b8b?auto=format&fit=crop&w=1740&q=80',
  
  // Miền Nam
  'ho chi minh': 'https://images.unsplash.com/photo-1583422409516-2d902b403d1a?auto=format&fit=crop&w=1740&q=80',
  'phu quoc': 'https://images.unsplash.com/photo-1601752945207-0a2d6d4a5f6e?auto=format&fit=crop&w=1740&q=80',
  'kien giang': 'https://images.unsplash.com/photo-1601752945207-0a2d6d4a5f6e?auto=format&fit=crop&w=1740&q=80',
  'mekong delta': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1740&q=80',
  'can tho': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1740&q=80',
};

// Hàm tìm ảnh dựa trên query
export const getProvinceImage = (query) => {
  if (!query) {
    return DEFAULT_HERO_IMAGE;
  }

  const lowerQuery = query.toLowerCase();

  // Tìm từ khóa đầu tiên khớp
  for (const key in PROVINCE_IMAGE_MAP) {
    if (lowerQuery.includes(key)) {
      return PROVINCE_IMAGE_MAP[key];
    }
  }

  // Nếu không tìm thấy, trả về ảnh mặc định
  return DEFAULT_HERO_IMAGE;
};