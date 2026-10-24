const BASE = "https://bookvn.net/newsong/newsong";
const list = document.getElementById("list");

// Chạy trong trang: lấy toàn bộ text hiển thị
function grabText() {
  return document.body.innerText;
}

// Một mục: số bài thường ("12") hoặc phụ lục ("PL1", "PL 1", "phụ lục 1", "Phụ Lục 1")
const ITEM = String.raw`(?:(?:PL|ph[uụ]\s*l[uụ]c)\s*)?\d+`;
const ITEM_RE = /((?:PL|ph[uụ]\s*l[uụ]c)\s*)?(\d+)/giu;
const LINE_RE = new RegExp(
  String.raw`Hát\s*BCM\s*:?\s*(?:[^\d\n]{0,80}?)(${ITEM}(?:[\s\-–—,;/]+${ITEM})*)\s*(\(\s*[\d:]+\s*\))?`,
  "iu",
);

// Dòng tuỳ chọn: "... hát thêm BCM 03 và ..." (chỉ hát khi điểm nhóm trên 10 người)
const OPTIONAL_RE = new RegExp(
  String.raw`hát\s*thêm\s*BCM\s*:?\s*(${ITEM}(?:[\s\-–—,;/]+${ITEM})*)`,
  "iu",
);

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

    const opt = line.match(OPTIONAL_RE);
    const m = opt || line.match(LINE_RE);
    if (m) {
      const nums = [...m[1].matchAll(ITEM_RE)].map((x) =>
        x[1] ? `PL${parseInt(x[2], 10)}` : String(parseInt(x[2], 10)),
      );
      if (nums.length) {
        current.lines.push({
          nums,
          time: !opt && m[2] ? m[2].replace(/\s/g, "") : "",
          optional: !!opt,
        });
      }
    }
  }
  return sessions.filter((s) => s.lines.length);
}

// Giao việc mở tab cho background.js (popup sẽ bị đóng khi đổi tab)
function openSongs(nums) {
  chrome.runtime.sendMessage({ type: "openSongs", nums });
}

// "PL3" -> "PL 3" để dễ đọc, số thường giữ nguyên
function formatItem(n) {
  return n.replace(/^PL/, "PL ");
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
    allBtn.onclick = () => openSongs(s.lines.filter((l) => !l.optional).flatMap((l) => l.nums));
    head.appendChild(allBtn);
    box.appendChild(head);

    for (const l of s.lines) {
      const row = document.createElement("div");
      row.className = "line";
      const label = document.createElement("span");
      label.innerHTML = `<span class="nums">${l.nums.map(formatItem).join(" - ")}</span> <span class="time">${l.optional ? "(optional, khi điểm nhóm >10 người)" : l.time}</span>`;
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
