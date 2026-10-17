const BASE = "https://bookvn.net/newsong/newsong";
const APPX_BASE = "https://bookvn.net/newsong/newsong-appx";

// "12" -> .../newsong12 ; "PL3" -> .../newsong-appx003
function songUrl(n) {
  const pl = /^PL(\d+)$/.exec(n);
  return pl ? APPX_BASE + pl[1].padStart(3, "0") : BASE + n;
}

// Mở tab ở background (service worker) để không bị dừng khi popup đóng
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "openSongs" && Array.isArray(msg.nums)) {
    (async () => {
      const [cur] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      let index = cur ? cur.index + 1 : undefined;
      let firstId = null;
      for (const n of msg.nums) {
        const opts = { url: songUrl(n), active: false };
        if (index !== undefined) opts.index = index++;
        const tab = await chrome.tabs.create(opts);
        if (firstId === null) firstId = tab.id;
      }
      // Mở xong hết mới chuyển sang tab đầu tiên
      if (firstId !== null) await chrome.tabs.update(firstId, { active: true });
      sendResponse({ ok: true });
    })();
    return true; // giữ kênh phản hồi cho async
  }
});
