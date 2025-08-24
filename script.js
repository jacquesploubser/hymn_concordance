// script.js

console.log("✅ script.js loaded");

let concordance = {};
let currentSource = 'concordance.json'; // default; will be set from the <select>

/** Load and parse the JSON for the chosen dataset, then render */
async function loadData(src) {
  try {
    currentSource = src || currentSource;
    console.log("⏳ Fetching", currentSource, "…");
    const res = await fetch(currentSource, { cache: "no-store" });
    console.log("📥 Fetch status:", res.status);
    if (!res.ok) throw new Error(`Failed to fetch ${currentSource}: ${res.status}`);

    concordance = await res.json();
    console.log("🔑 Parsed JSON; word count =", Object.keys(concordance).length);

    renderList(Object.keys(concordance));
    document.getElementById("details").innerHTML = "";
  } catch (err) {
    console.error("❌ loadData error:", err);
    const list = document.getElementById("wordList");
    list.innerHTML = `<div class="text-sm text-red-600">Could not load <code>${currentSource}</code>. Check the file is present.</div>`;
  }
}

/** Render a list of word keys in the left pane */
function renderList(words) {
  console.log("🎨 renderList got", words.length, "words");
  const list = document.getElementById("wordList");
  list.innerHTML = "";

  words.forEach(w => {
    const div = document.createElement("div");
    const count = concordance[w]?.count ?? 0;
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
  det.innerHTML = `<h2 class="text-lg font-semibold mb-2">${word.toUpperCase()}</h2>`;

  (concordance[word]?.occurrences || []).forEach(o => {
    const p = document.createElement("p");
    const metaLine = o.metadata || "";
    p.className = "mb-4";
    p.innerHTML = `
      <strong>Hymn ${o.hymn_number}, Verse ${o.verse_number}</strong><br>
      ${metaLine ? `${metaLine}<br>` : ""}
      ${highlight(o.verse_text || "", document.getElementById("search").value)}
    `;
    det.appendChild(p);
  });
}

/** Highlight terms in a verse text */
function highlight(text, raw) {
  if (!raw) return text;
  const terms = raw.trim().toLowerCase().split(/\s+/).filter(t => t);
  let out = text;
  terms.forEach(term => {
    const re = new RegExp(`(${escapeRegExp(term)})`, "gi");
    out = out.replace(re, `<span class="highlight">$1</span>`);
  });
  return out;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Find hymns whose verse_text contains ALL given terms */
function findHymnsMatchingAll(terms) {
  const hymnsMap = {};
  Object.values(concordance).forEach(entry => {
    (entry.occurrences || []).forEach(o => {
      const txt = (o.verse_text || "").toLowerCase();
      if (terms.every(t => txt.includes(t))) {
        const key = `${o.hymn_number}:${o.verse_number}`;
        hymnsMap[key] = o;
      }
    });
  });
  return Object.values(hymnsMap);
}

/** Render a list of hymn occurrences */
function renderHymnList(hymns) {
  console.log("🎨 renderHymnList got", hymns.length, "hymns");
  const list = document.getElementById("wordList");
  list.innerHTML = "";

  hymns.forEach(o => {
    const div = document.createElement("div");
    div.className = "word-item px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800";
    const title = o.hymn_title || "";
    div.textContent = `Hymn ${o.hymn_number}, Verse ${o.verse_number}${title ? " – " + title : ""}`;
    div.onclick = () => {
      const det = document.getElementById("details");
      const metaLine = o.metadata || "";
      det.innerHTML = `
        <h2 class="text-lg font-semibold mb-2">Hymn ${o.hymn_number}, Verse ${o.verse_number}</h2>
        ${metaLine ? `<p>${metaLine}</p>` : ""}
        <p>${highlight(o.verse_text || "", document.getElementById("search").value)}</p>
      `;
    };
    list.appendChild(div);
  });
}

/** Filter logic */
function applyFilter() {
  console.log("🔍 applyFilter() fired");
  const raw = document.getElementById("search").value.trim().toLowerCase();
  const terms = raw.split(/\s+/).filter(t => t);
  const matchAll = document.getElementById("matchAll").checked;

  if (matchAll && terms.length > 1) {
    const hymns = findHymnsMatchingAll(terms);
    renderHymnList(hymns);
    document.getElementById("details").innerHTML = "";
    return;
  }

  const keys = Object.keys(concordance);
  const matches = terms.length === 0
    ? keys
    : keys.filter(w => terms.some(t => w.includes(t)));

  renderList(matches);
  document.getElementById("details").innerHTML = "";
}

/** Bootstrap */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("search");
  const btn   = document.getElementById("searchBtn");
  const dsSel = document.getElementById("dataset");

  // Load initial dataset
  if (dsSel && dsSel.value) {
    currentSource = dsSel.value;
  }
  btn.onclick = applyFilter;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilter();
    }
  });
  dsSel?.addEventListener("change", () => {
    loadData(dsSel.value);
  });

  loadData(currentSource);
});
