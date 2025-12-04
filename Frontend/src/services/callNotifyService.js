// src/services/callNotifyService.js
const callNotifyService = {
  connect: () => console.log("[CallNotify] Disabled for testing"),
  disconnect: () => {},
  send: () => {},
  // Các hàm mà CallProvider đang gọi – BẮT BUỘC phải có!
  on: () => () => {},           // <- thêm dòng này
  off: () => {},                // <- thêm dòng này
  onMessage: () => () => {},    // <- thêm dòng này (nếu có dùng)
  emit: () => {},               // <- thêm nếu cần
};

export default callNotifyService;
export { callNotifyService };