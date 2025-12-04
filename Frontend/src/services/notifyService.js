// src/services/notifyService.js
const notifyService = {
  connect: () => console.log("[Notify] Disabled for testing"),
  disconnect: () => {},
  on: () => () => {},           // <- thêm dòng này
  off: () => {},                // <- thêm dòng này
  onMessage: () => () => {},    // <- thêm dòng này
};

export default notifyService;
export { notifyService as notificationService };