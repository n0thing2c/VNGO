// ẢNH FALLBACK: Dùng khi user tìm kiếm linh tinh
const DEFAULT_PROVINCE_HERO_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
const DEFAULT_PROVINCE_POPDEST_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';

const PROVINCE_HERO_IMAGE_MAP = {
  // Miền Bắc 
  "ha-noi": "https://images.unsplash.com/photo-1710141968143-7ea1f6d89025?q=80&w=2117&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "hanoi": 'https://images.unsplash.com/photo-1710141968143-7ea1f6d89025?q=80&w=2117&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  "hai-phong": "https://images.unsplash.com/photo-1581077747250-3ffdeba79d0a?q=80&w=1740",
  "bac-ninh": "https://images.unsplash.com/photo-1553158398-15b88f1082a4?q=80&w=1740",
  "hung-yen": "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1740",
  "quang-ninh": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1740",
  "lang-son": "https://images.unsplash.com/photo-1594898234439-b0a962f8d833?q=80&w=1740",
  "lao-cai": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1740",
  "lai-chau": "https://images.unsplash.com/photo-1661445434692-c0507b212ea1?q=80&w=1740",
  "dien-bien": "https://images.unsplash.com/photo-1519822472647-00a83d45a2d5?q=80&w=1740",
  "son-la": "https://images.unsplash.com/photo-1603544264653-77f3d5be5d2b?q=80&w=1740",
  "cao-bang": "https://images.unsplash.com/photo-1537967592661-2e6b2cf80748?q=80&w=1740",
  "tuyen-quang": "https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=1740",
  "thai-nguyen": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1740",
  "phu-tho": "https://images.unsplash.com/photo-1534351590666-13e3e4c948fd?q=80&w=1740",
  "ninh-binh": "https://images.unsplash.com/photo-1508264165352-258a6b1fbbd4?q=80&w=1740",
  
  // Miền Trung
  'da-nang': 'https://images.unsplash.com/photo-1561570777-2c1b8b63b86a?auto=format&fit=crop&w=1740&q=80',
  'hoi-an': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1740&q=80',
  'quang-nam': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1740&q=80',
  'hue': 'https://images.unsplash.com/photo-1598404418022-f173f4007b8b?auto=format&fit=crop&w=1740&q=80',
  'thua-thien-hue': 'https://images.unsplash.com/photo-1598404418022-f173f4007b8b?auto=format&fit=crop&w=1740&q=80',
  
  // Miền Nam
  'ho-chi-minh': 'https://images.unsplash.com/photo-1521019795854-14e15f600980?q=80&w=2232&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'saigon': 'https://images.unsplash.com/photo-1521019795854-14e15f600980?q=80&w=2232&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  "dong-nai": "https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=1740",
  "tay-ninh": "https://images.unsplash.com/photo-1583595276651-b289f10ca49b?q=80&w=1740",
  "vinh-long": "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1740",
  "dong-thap": "https://images.unsplash.com/photo-1470075801209-17f9ec0cada7?q=80&w=1740",
  "ca-mau": "https://images.unsplash.com/photo-1493558103817-58b2924bce98?q=80&w=1740",
  "an-giang": "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1740",
  "can-tho": "https://images.unsplash.com/photo-1525895921573-b0dd2b8cd161?q=80&w=1740",
};

const PROVINCE_POPDEST_IMAGE_MAP = {
  // Miền Bắc 
  "ha-noi": "https://images.unsplash.com/photo-1710141968143-7ea1f6d89025?q=80&w=2117&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "hanoi": 'https://images.unsplash.com/photo-1710141968143-7ea1f6d89025?q=80&w=2117&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  "hai-phong": "https://images.unsplash.com/photo-1581077747250-3ffdeba79d0a?q=80&w=1740",
  "bac-ninh": "https://images.unsplash.com/photo-1553158398-15b88f1082a4?q=80&w=1740",
  "hung-yen": "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1740",
  "quang-ninh": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1740",
  "lang-son": "https://images.unsplash.com/photo-1594898234439-b0a962f8d833?q=80&w=1740",
  "lao-cai": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1740",
  "lai-chau": "https://images.unsplash.com/photo-1661445434692-c0507b212ea1?q=80&w=1740",
  "dien-bien": "https://images.unsplash.com/photo-1519822472647-00a83d45a2d5?q=80&w=1740",
  "son-la": "https://images.unsplash.com/photo-1603544264653-77f3d5be5d2b?q=80&w=1740",
  "cao-bang": "https://images.unsplash.com/photo-1537967592661-2e6b2cf80748?q=80&w=1740",
  "tuyen-quang": "https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=1740",
  "thai-nguyen": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1740",
  "phu-tho": "https://images.unsplash.com/photo-1534351590666-13e3e4c948fd?q=80&w=1740",
  "ninh-binh": "https://images.unsplash.com/photo-1508264165352-258a6b1fbbd4?q=80&w=1740",
  
  // Miền Trung
  'da-nang': 'https://images.unsplash.com/photo-1561570777-2c1b8b63b86a?auto=format&fit=crop&w=1740&q=80',
  'hoi-an': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1740&q=80',
  'quang-nam': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1740&q=80',
  'hue': 'https://images.unsplash.com/photo-1598404418022-f173f4007b8b?auto=format&fit=crop&w=1740&q=80',
  'thua-thien-hue': 'https://images.unsplash.com/photo-1598404418022-f173f4007b8b?auto=format&fit=crop&w=1740&q=80',
  
  // Miền Nam
  'ho-chi-minh': 'https://images.unsplash.com/photo-1521019795854-14e15f600980?q=80&w=2232&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'saigon': 'https://images.unsplash.com/photo-1521019795854-14e15f600980?q=80&w=2232&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  "dong-nai": "https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=1740",
  "tay-ninh": "https://images.unsplash.com/photo-1583595276651-b289f10ca49b?q=80&w=1740",
  "vinh-long": "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1740",
  "dong-thap": "https://images.unsplash.com/photo-1470075801209-17f9ec0cada7?q=80&w=1740",
  "ca-mau": "https://images.unsplash.com/photo-1493558103817-58b2924bce98?q=80&w=1740",
  "an-giang": "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1740",
  "can-tho": "https://images.unsplash.com/photo-1525895921573-b0dd2b8cd161?q=80&w=1740",
};

// Hàm chuẩn hóa chuỗi input (quan trọng)
const normalizeString = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD") // Tách dấu
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
    .toLowerCase()
    .trim()
    .replace(/ /g, "-") // Thay khoảng trắng bằng gạch nối
    .replace("thanh-pho-", "") // Bỏ chữ thành phố nếu có
    .replace("tinh-", "") // Bỏ chữ tỉnh nếu có
    .replace("city-", "") // thêm cho chắc
    .replace("province-", ""); // thêm cho chắc
};

// Hàm tìm ảnh dựa trên query
export const getProvinceHeroImage = (query) => {
  if (!query) {
    return DEFAULT_PROVINCE_HERO_IMAGE;
  }

  const lowerQuery = normalizeString(query);

  // Tìm từ khóa đầu tiên khớp
  for (const key in PROVINCE_HERO_IMAGE_MAP) {
    if (lowerQuery.includes(key)) {
      return PROVINCE_HERO_IMAGE_MAP[key];
    }
  }

  // Nếu không tìm thấy, trả về ảnh mặc định
  return DEFAULT_PROVINCE_HERO_IMAGE;
};

export const getProvincePopDestImage = (query) => {
  if (!query) {
    return DEFAULT_PROVINCE_HERO_IMAGE;
  }

  const lowerQuery = normalizeString(query);

  // Tìm từ khóa đầu tiên khớp
  for (const key in PROVINCE_POPDEST_IMAGE_MAP) {
    if (lowerQuery.includes(key)) {
      return PROVINCE_POPDEST_IMAGE_MAP[key];
    }
  }

  // Nếu không tìm thấy, trả về ảnh mặc định
  return DEFAULT_PROVINCE_POPDEST_IMAGE;
};