// script.js

console.log("✅ script.js loaded");

let concordance = {};

/** Load and parse the JSON, then render the full word list */
async function loadData() {
  try {
    console.log("⏳ Fetching concordance.json...");
    const res = await fetch("concordance.json");
    console.log("📥 Fetch status:", res.status);

    concordance = await res.json();
    console.log("🔑 Parsed JSON; word count =", Object.keys(concordance).length);

    // Initial full render of words
    renderList(Object.keys(concordance));
  } catch (err) {
    console.error("❌ loadData error:", err);
  }
}

/** Render a list of word keys in the left pane */
function renderList(words) {
  console.log("🎨 renderList got", words.length, "words");
  const list = document.getElementById("wordList");
  list.innerHTML = "";

  words.forEach(w => {
    const div = document.createElement("div");
    div.textContent = `${w.toUpperCase()} (${concordance[w].count})`;
    div.className = "word-item";
    div.onclick = () => showDetails(w);
    list.appendChild(div);
  });
}

/** Show details for a single word (its occurrences) */
function showDetails(word) {
  console.log("👁️ showDetails for", word);
  const det = document.getElementById("details");
  det.innerHTML = `<h2>${word.toUpperCase()}</h2>`;

concordance[word].occurrences.forEach(o => {
  const p = document.createElement("p");
  // use the raw metadata line if present
  const metaLine = o.metadata || "";
  p.innerHTML = `
    <strong>Hymn ${o.hymn_number}, Verse ${o.verse_number}</strong><br>
    ${metaLine}<br>
    ${highlight(o.verse_text, document.getElementById("search").value)}
  `;
  det.appendChild(p);
});


/** Highlight all instances of each search term in a verse text */
function highlight(text, raw) {
  if (!raw) return text;
  const terms = raw.trim().toLowerCase().split(/\s+/).filter(t => t);
  let out = text;
  terms.forEach(term => {
    const re = new RegExp(`(${term})`, "gi");
    out = out.replace(re, `<span class="highlight">$1</span>`);
  });
  return out;
}

/** Find hymns whose verse_text contains ALL the given terms */
function findHymnsMatchingAll(terms) {
  const hymnsMap = {};
  Object.values(concordance).forEach(entry => {
    entry.occurrences.forEach(o => {
      const txt = o.verse_text.toLowerCase();
      if (terms.every(t => txt.includes(t))) {
        const key = `${o.hymn_number}:${o.verse_number}`;
        hymnsMap[key] = o;
      }
    });
  });
  return Object.values(hymnsMap);
}

/** Render a list of hymn occurrences, instead of words */
function renderHymnList(hymns) {
  console.log("🎨 renderHymnList got", hymns.length, "hymns");
  const list = document.getElementById("wordList");
  list.innerHTML = "";

  hymns.forEach(o => {
    const div = document.createElement("div");
    div.className = "word-item";
    div.textContent = `Hymn ${o.hymn_number}, Verse ${o.verse_number} – ${o.hymn_title}`;
    div.onclick = () => {
      const metaLine = o.metadata || "";
      det.innerHTML = `
        <h2>Hymn ${o.hymn_number}, Verse ${o.verse_number}</h2>
        <p>${metaLine}</p>
        <p>${highlight(o.verse_text, document.getElementById("search").value)}</p>
  `  ;
};

    list.appendChild(div);
  });
}

/** Filter logic: words or hymns depending on “Match all” + term count */
function applyFilter() {
  console.log("🔍 applyFilter() fired");
  const raw   = document.getElementById("search").value.trim().toLowerCase();
  const terms = raw.split(/\s+/).filter(t => t);
  const matchAll = document.getElementById("matchAll").checked;

  if (matchAll && terms.length > 1) {
    // hymn-level “all terms” search
    const hymns = findHymnsMatchingAll(terms);
    renderHymnList(hymns);
    document.getElementById("details").innerHTML = "";
    return;
  }

  // otherwise word-level “any term” search
  const keys = Object.keys(concordance);
  const matches = terms.length === 0
    ? keys
    : keys.filter(w => terms.some(t => w.includes(t)));

  renderList(matches);
  document.getElementById("details").innerHTML = "";
}

// Wire up click, Enter, and initial load
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("search");
  const btn   = document.getElementById("searchBtn");

  btn.onclick = applyFilter;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilter();
    }
  });

  loadData();
});
