// script.js

console.log("✅ script.js loaded");

let concordance = {};
let currentSource = 'concordance.json'; // default; will be set from the <select>

/** Load and parse the JSON (or .gz) for the chosen dataset, then render */
async function loadData(src) {
  try {
    currentSource = src || currentSource;
    console.log("⏳ Fetching", currentSource, "…");

    // Support gzip (via pako) or plain JSON
    if (currentSource.endsWith(".gz")) {
      // fetch compressed, inflate with pako
      const res = await fetch(currentSource, { cache: "no-store" });
      console.log("📥 Fetch status:", res.status);
      if (!res.ok) throw new Error(`Failed to fetch ${currentSource}: ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const text = pako.inflate(buf, { to: "string" });
      concordance = JSON.parse(text);
    } else {
      // normal JSON
      const res = await fetch(currentSource, { cache: "no-store" });
      console.log("📥 Fetch status:", res.status);
      if (!res.ok) throw new Error(`Failed to fetch ${currentSource}: ${res.status}`);
      concordance = await res.json();
    }

    console.log("🔑 Parsed JSON; word count =", Object.keys(concordance).length);

    // Render full word list and clear details
    renderList(Object.keys(concordance));
    const det = document.getElementById("details");
    if (det) det.innerHTML = "";
  } catch (err) {
    console.error("❌ loadData error:", err);
    const list = document.getElementById("wordList");
    if (list) {
      list.innerHTML = `
        <div class="text-sm text-red-600">
          Could not load <code>${escapeHtml(currentSource)}</code>.<br>
          Ensure the file exists and the path matches the dropdown value.
        </div>`;
    }
  }
}

/** Render a list of word keys in the left pane */
function renderList(words) {
  console.log("🎨 renderList got", words.length, "words");
  const list = document.getElementById("wordList");
  if (!list) return;
  list.innerHTML = "";

  // Sort words for deterministic UI (alphabetical)
  const sorted = words.slice().sort((a, b) => a.localeCompare(b));
  sorted.forEach(w => {
    const entry = concordance[w];
    const count = entry?.count ?? 0;

    const div = document.createElement("div");
    div.textContent = `${w.toUpperCase()} (${count})`;
    div.className = "word-item px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800";
    div.onclick = () => showDetails(w);
    list.appendChild(div);
  });
}

/** Show details for a single word (its occurrences) */
function showDetails(word) {
  console.log("👁️ showDetails for", word);
  const det = document.getElementById("details");
  if (!det) return;

  const entry = concordance[word];
  if (!entry) {
    det.innerHTML = `<h2 class="text-lg font-semibold mb-2">${escapeHtml(word.toUpperCase())}</h2>
      <p class="text-sm text-slate-500">No occurrences found.</p>`;
    return;
  }

  det.innerHTML = `<h2 class="text-lg font-semibold mb-2">${escapeHtml(word.toUpperCase())}</h2>`;

  (entry.occurrences || []).forEach(o => {
    const p = document.createElement("p");
    const metaLine = o.metadata || "";
    p.className = "mb-4";
    p.innerHTML = `
      <strong>Hymn ${escapeHtml(o.hymn_number)}, Verse ${escapeHtml(o.verse_number)}${o.hymn_title ? " — " + escapeHtml(o.hymn_title) : ""}</strong><br>
      ${metaLine ? `${escapeHtml(metaLine)}<br>` : ""}
      ${highlight(o.verse_text || "", document.getElementById("search")?.value || "")}
    `;
    det.appendChild(p);
  });
}

/** Highlight terms in a verse text */
function highlight(text, raw) {
  if (!raw) return escapeHtml(text);
  const terms = raw.trim().toLowerCase().split(/\s+/).filter(t => t);
  if (terms.length === 0) return escapeHtml(text);

  // Escape text first, then wrap matches
  let out = escapeHtml(text);
  terms.forEach(term => {
    const re = new RegExp(`(${escapeRegExp(term)})`, "gi");
    out = out.replace(re, `<span class="highlight">$1</span>`);
  });
  return out;
}

/** Hymn-level search: find verses containing ALL given terms */
function findHymnsMatchingAll(terms) {
  const hymnsMap = {};
  Object.values(concordance).forEach(entry => {
    (entry.occurrences || []).forEach(o => {
      const txt = (o.verse_text || "").toLowerCase();
      if (terms.every(t => txt.includes(t))) {
        const key = `${o.hymn_number}:${o.verse_number}:${o.hymn_title || ""}`;
        hymnsMap[key] = o;
      }
    });
  });
  return Object.values(hymnsMap);
}

/** Render a list of hymn occurrences (used for “Match all” mode) */
function renderHymnList(hymns) {
  console.log("🎨 renderHymnList got", hymns.length, "hymns");
  const list = document.getElementById("wordList");
  if (!list) return;
  list.innerHTML = "";

  // Sort by hymn number then verse
  hymns.sort((a, b) => {
    const hn = toInt(a.hymn_number) - toInt(b.hymn_number);
    if (hn !== 0) return hn;
    return toInt(a.verse_number) - toInt(b.verse_number);
  });

  hymns.forEach(o => {
    const div = document.createElement("div");
    div.className = "word-item px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800";
    const title = o.hymn_title ? ` — ${o.hymn_title}` : "";
    div.textContent = `Hymn ${o.hymn_number}, Verse ${o.verse_number}${title}`;
    div.onclick = () => {
      const det = document.getElementById("details");
      if (!det) return;
      const metaLine = o.metadata || "";
      det.innerHTML = `
        <h2 class="text-lg font-semibold mb-2">Hymn ${escapeHtml(o.hymn_number)}, Verse ${escapeHtml(o.verse_number)}${o.hymn_title ? " — " + escapeHtml(o.hymn_title) : ""}</h2>
        ${metaLine ? `<p>${escapeHtml(metaLine)}</p>` : ""}
        <p>${highlight(o.verse_text || "", document.getElementById("search")?.value || "")}</p>
      `;
    };
    list.appendChild(div);
  });
}

/** Filter logic */
function applyFilter() {
  console.log("🔍 applyFilter() fired");
  const input = document.getElementById("search");
  const raw = (input?.value || "").trim().toLowerCase();
  const terms = raw.split(/\s+/).filter(t => t);
  const matchAll = document.getElementById("matchAll")?.checked;

  if (matchAll && terms.length > 1) {
    // hymn‐level “all terms” search
    const hymns = findHymnsMatchingAll(terms);
    renderHymnList(hymns);
    const det = document.getElementById("details");
    if (det) det.innerHTML = "";
    return;
  }

  // otherwise word‐level “any term” search
  const keys = Object.keys(concordance);
  const matches = terms.length === 0
    ? keys
    : keys.filter(w => terms.some(t => w.includes(t)));

  renderList(matches);
  const det = document.getElementById("details");
  if (det) det.innerHTML = "";
}

/** Utilities */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toInt(x) {
  const n = parseInt(x, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Bootstrap */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("search");
  const btn   = document.getElementById("searchBtn");
  const dsSel = document.getElementById("dataset");

  // Initial dataset selection from dropdown if present
  if (dsSel && dsSel.value) {
    currentSource = dsSel.value;
  }

  // Wire up UI
  btn && (btn.onclick = applyFilter);
  input && input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilter();
    }
  });
  dsSel && dsSel.addEventListener("change", () => {
    loadData(dsSel.value);
  });

  // First load
  loadData(currentSource);
});
