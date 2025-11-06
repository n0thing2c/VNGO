import random
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.files import File
from django.contrib.auth.models import User
from faker import Faker

# Import models của bạn
from Tour.models import Place, Tour, TourImage, TourPlace, Transportation, MeetingLocation

# Khởi tạo Faker
fake = Faker("vi_VN") # Dùng ngôn ngữ Tiếng Việt cho thực tế

# --- CẤU HÌNH ---
NUM_USERS = 10
NUM_PLACES = 20
NUM_TOURS = 50
MAX_PLACES_PER_TOUR = 5
MAX_IMAGES_PER_TOUR = 4
TAG_LIST = ["Nature", "History", "Festivals", "Nightlife", "Shopping", "Sightseeing", "Adventure", "Trekking", "Beach", "Food Tour", "Motorbike Trip"]

# Đường dẫn tới thư mục ảnh mẫu (bước 2)
# Dùng os.path.join để đảm bảo chạy trên mọi HĐH
SEED_IMAGE_DIR = os.path.join(settings.BASE_DIR, 'Tour/static/seed_images')

# Đường dẫn tới thư mục media/tour_images
TOUR_IMAGE_UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, 'tour_images')


class Command(BaseCommand):
    help = 'Nâng cấp: Seeds DB với hàng loạt data dùng Faker và xử lý ảnh tự động'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Bắt đầu seeding data..."))

        # 0. Lấy danh sách ảnh mẫu
        self.image_files = self.get_image_files()
        if not self.image_files:
            self.stdout.write(self.style.ERROR(
                f"Không tìm thấy ảnh mẫu trong: {SEED_IMAGE_DIR}."
            ))
            self.stdout.write(self.style.ERROR("Vui lòng chạy Bước 2 và thêm ảnh."))
            return # Dừng script nếu không có ảnh

        # 1. Xóa data cũ
        self.clear_data()
        
        # 2. Tạo Users (cho Tourist, TourGuide sau này)
        self.create_users()

        # 3. Tạo Places (Địa điểm)
        self.create_places()

        # 4. Tạo Tours
        self.create_tours()

        self.stdout.write(self.style.SUCCESS(f"\nHOÀN TẤT: Đã tạo {NUM_USERS} Users, {NUM_PLACES} Places, {NUM_TOURS} Tours."))


    def get_image_files(self):
        """Lấy danh sách các file ảnh trong thư mục seed_images"""
        if not os.path.exists(SEED_IMAGE_DIR):
            return []
        
        files = [f for f in os.listdir(SEED_IMAGE_DIR) if f.endswith(('.jpg', '.jpeg', '.png'))]
        # Trả về đường dẫn đầy đủ
        return [os.path.join(SEED_IMAGE_DIR, f) for f in files]


    def clear_data(self):
        """Xóa toàn bộ data cũ để làm lại từ đầu"""
        self.stdout.write("  -> Đang xóa data cũ...")
        TourPlace.objects.all().delete()
        TourImage.objects.all().delete()
        Tour.objects.all().delete()
        Place.objects.all().delete()
        User.objects.filter(is_superuser=False).delete() # Chỉ xóa user thường
        self.stdout.write("     Đã xóa xong.")


    def create_users(self):
        """Tạo Users mẫu"""
        self.stdout.write(f"  -> Đang tạo {NUM_USERS} Users...")
        for i in range(NUM_USERS):
            profile = fake.profile()

            # Thêm số (i) vào cuối username để ĐẢM BẢO TÍNH DUY NHẤT
            # Tránh trùng lặp với superuser (admin) hoặc trùng lặp lẫn nhau
            unique_username = f"{profile['username']}_{i}"

            User.objects.create_user(
                username=unique_username,
                email=profile['mail'],
                password='password123', # Mật khẩu chung cho dễ test
                first_name=fake.first_name(),
                last_name=fake.last_name()
            )
        # TODO: Sau này khi có model Tourist/TourGuide, bạn sẽ link User vừa tạo
        # với model đó tại đây.
        # Ví dụ: Tourist.objects.create(user=user_vua_tao, ...)


    def create_places(self):
        """Tạo Places (Địa điểm) ngẫu nhiên tại Việt Nam"""
        self.stdout.write(f"  -> Đang tạo {NUM_PLACES} Places...")
        for _ in range(NUM_PLACES):
            # Tạo tọa độ ngẫu nhiên ở Việt Nam
            lat, lon, _, _, _ = fake.local_latlng(country_code='VN')
            address = fake.address() # "247 Phố Chiêu, Huyện Hà Đông, Hà Nội"
            
            # Tách tên đường/phường và thành phố
            try:
                name = address.split(',')[0] # "247 Phố Chiêu"
                city = address.split(',')[-1].strip() # "Hà Nội"
                name_en = f"{name}, {city}"
            except:
                name = address
                name_en = address

            Place.objects.create(
                lat=lat,
                lon=lon,
                name=name,
                name_en=name_en
            )


    def create_tours(self):
        """Tạo Tours ngẫu nhiên, link với Places và Images"""
        self.stdout.write(f"  -> Đang tạo {NUM_TOURS} Tours (và link ảnh)...")

        # Lấy tất cả Places đã tạo
        all_places = list(Place.objects.all())
        
        if not all_places:
            self.stdout.write(self.style.WARNING("  -> Không có Places, bỏ qua tạo Tours."))
            return

        # Tạo thư mục media/tour_images nếu chưa có
        os.makedirs(TOUR_IMAGE_UPLOAD_DIR, exist_ok=True)

        for _ in range(NUM_TOURS):
            tour = Tour.objects.create(
                name=fake.sentence(nb_words=5).replace('.', ' ở ' + fake.city()),
                duration=random.randint(2, 12), # 2-12 tiếng
                min_people=random.randint(1, 3),
                max_people=random.randint(5, 15),
                transportation=random.choice([c[0] for c in Transportation.choices]),
                meeting_location=random.choice([c[0] for c in MeetingLocation.choices]),
                price=random.randint(200000, 3000000), # 200k - 3 triệu
                tags=random.sample(TAG_LIST, k=random.randint(1, 4)), # Chọn 1-4 tags
                description=fake.text(max_nb_chars=500),
                rating=random.randint(0, 50), # Tổng điểm rating (vd: 45)
                rates=random.randint(1, 10), # Tổng số lượt rate (vd: 10)
            )

            # --- Link Places vào Tour (QUAN TRỌNG) ---
            # Random số lượng places cho tour này
            num_places_for_this_tour = random.randint(1, MAX_PLACES_PER_TOUR)
            # Lấy ngẫu nhiên các places từ list
            places_for_this_tour = random.sample(all_places, num_places_for_this_tour)
            
            for index, place in enumerate(places_for_this_tour):
                TourPlace.objects.create(
                    tour=tour,
                    place=place,
                    order=index # Đánh số thứ tự 0, 1, 2...
                )
            # Dòng trên đảm bảo 1 place có thể thuộc nhiều tour
            # => Giúp test "Popular Destinations"

            # --- Link Images vào Tour (QUAN TRỌNG) ---
            num_images = random.randint(1, MAX_IMAGES_PER_TOUR)
            images_for_this_tour = random.sample(self.image_files, num_images)
            
            thumbnail_set = False
            for img_path in images_for_this_tour:
                # Đây là logic copy file từ static -> media
                # Lấy tên file: "place1.jpg"
                img_filename = os.path.basename(img_path)
                
                # Tạo đường dẫn đích: "media/tour_images/place1.jpg"
                media_path = os.path.join(TOUR_IMAGE_UPLOAD_DIR, img_filename)
                
                # Copy file ảnh
                with open(img_path, 'rb') as f_src:
                    with open(media_path, 'wb') as f_dst:
                        f_dst.write(f_src.read())
                
                # Tạo đối tượng TourImage trong DB
                # Quan trọng: image.save() yêu cầu đường dẫn TƯƠNG ĐỐI
                relative_path = os.path.join('tour_images', img_filename)
                
                is_thumb = False
                if not thumbnail_set:
                    is_thumb = True
                    thumbnail_set = True

                TourImage.objects.create(
                    tour=tour,
                    image=relative_path, # "tour_images/place1.jpg"
                    isthumbnail=is_thumb
                )