// Chỉ dùng khi xem popup.html ngoài extension (mở file trực tiếp / Live Preview).
// Trong extension thật, chrome.tabs đã có sẵn nên file này không làm gì cả.
if (!globalThis.chrome?.tabs) {
  const SAMPLE = `
BUỔI SÁNG (Chủ nhật)
Hát BCM: 12 - 45 - 300 (8:30)
Hát BCM: 7, 88 (9:15)
BUỔI CHIỀU
Hát BCM: 150 - 151 (14:00)
BUỔI TỐI
Hát BCM: 1 - 2 - 3 - 4 (19:30)
`;
  globalThis.chrome = {
    tabs: { query: async () => [{ id: 1 }] },
    scripting: { executeScript: async () => [{ result: SAMPLE }] },
    runtime: {
      sendMessage: (msg) => console.log("[mock] sendMessage", msg),
    },
  };
}
