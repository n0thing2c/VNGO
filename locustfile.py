from locust import HttpUser, task, between


class VNGOUser(HttpUser):
    # Cấu hình mặc định trỏ thẳng vào Backend Django của bạn
    host = "http://localhost:8000"

    # Thời gian nghỉ giữa các lần request (mô phỏng người dùng thật)
    wait_time = between(1, 3)

    @task
    def search_tours(self):
        # Test API tìm kiếm tour (API quan trọng nhất)
        # Locust sẽ tự động ghép host + đường dẫn này
        # URL thực tế: http://localhost:8000/api/tour/get/all/?location=Ho+Chi+Minh+City
        self.client.get("/api/tour/get/all/?location=Ho+Chi+Minh+City")

    @task
    def view_tour_detail(self):
        # Test xem chi tiết một tour cụ thể (ví dụ ID 1)
        # URL thực tế: http://localhost:8000/api/tour/get/1/
        self.client.get("/api/tour/get/1/")

    def on_start(self):
        # (Tùy chọn) Code chạy khi user bắt đầu, ví dụ: Login để lấy token
        pass