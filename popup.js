const BASE = "https://bookvn.net/newsong/newsong";
const list = document.getElementById("list");

// Chạy trong trang: lấy toàn bộ text hiển thị
function grabText() {
  return document.body.innerText;
}

// Tách các dòng "Hát BCM: ..." theo từng buổi (Sáng / Chiều / Tối)
function parse(text) {
  const sessions = [];
  let current = { name: "Chung", lines: [] };
  sessions.push(current);

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const head = line.match(/^BUỔI\s+(SÁNG|CHIỀU|TỐI)\b.*$/i);
    if (head) {
      current = { name: line, lines: [] };
      sessions.push(current);
      continue;
    }

    const m = line.match(
      /Hát\s*BCM\s*:?\s*([\d\s\-–—,;/]+)(\(\s*[\d:]+\s*\))?/i,
    );
    if (m) {
      const nums = (m[1].match(/\d+/g) || []).map((n) =>
        String(parseInt(n, 10)),
      );
      if (nums.length) {
        current.lines.push({ nums, time: m[2] ? m[2].replace(/\s/g, "") : "" });
      }
    }
  }
  return sessions.filter((s) => s.lines.length);
}

// Giao việc mở tab cho background.js (popup sẽ bị đóng khi đổi tab)
function openSongs(nums) {
  chrome.runtime.sendMessage({ type: "openSongs", nums });
}

function render(sessions) {
  list.innerHTML = "";
  if (!sessions.length) {
    list.innerHTML =
      '<p class="msg">Không tìm thấy dòng "Hát BCM: ..." nào trên trang này.</p>';
    return;
  }
  for (const s of sessions) {
    const box = document.createElement("div");
    box.className = "session";

    const head = document.createElement("div");
    head.className = "session-head";
    head.textContent = s.name;
    const allBtn = document.createElement("button");
    allBtn.className = "secondary";
    allBtn.textContent = "Mở cả buổi";
    allBtn.onclick = () => openSongs(s.lines.flatMap((l) => l.nums));
    head.appendChild(allBtn);
    box.appendChild(head);

    for (const l of s.lines) {
      const row = document.createElement("div");
      row.className = "line";
      const label = document.createElement("span");
      label.innerHTML = `<span class="nums">${l.nums.join(" - ")}</span> <span class="time">${l.time}</span>`;
      const btn = document.createElement("button");
      btn.textContent = `Mở ${l.nums.length} tab`;
      btn.onclick = () => openSongs(l.nums);
      row.append(label, btn);
      box.appendChild(row);
    }
    list.appendChild(box);
  }
}

(async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: grabText,
    });
    render(parse(res.result || ""));
  } catch (e) {
    list.innerHTML = `<p class="msg">Không đọc được trang này (${e.message}).</p>`;
  }
})();
