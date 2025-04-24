// script.js

console.log("✅ script.js loaded");

let concordance = {};

/** Load and parse the JSON, then render the full list */
async function loadData() {
  try {
    console.log("⏳ Fetching concordance.json...");
    const res = await fetch("concordance.json");
    console.log("📥 Fetch status:", res.status);

    concordance = await res.json();
    console.log("🔑 Parsed JSON; word count =", Object.keys(concordance).length);

    // Confirm the container exists
    const listEl = document.getElementById("wordList");
    console.log("👀 wordList container:", listEl);

    // Initial full render
    renderList(Object.keys(concordance));
  }
  catch (err) {
    console.error("❌ loadData error:", err);
  }
}

/**
 * Find all unique hymn occurrences whose verse text contains EVERY search term.
 * @param {string[]} terms  lower-cased search terms
 * @returns {Array}         array of occurrence objects
 */
function findHymnsMatchingAll(terms) {
  const hymns = {};  // key -> occurrence
  Object.values(concordance).forEach(entry => {
    entry.occurrences.forEach(o => {
      const txt = o.verse_text.toLowerCase();
      if (terms.every(t => txt.includes(t))) {
        const key = `${o.hymn_number}:${o.verse_number}`;
        hymns[key] = o;
      }
    });
  });
  return Object.values(hymns);
}

/**
 * Render a list of hymn occurrences in the left pane.
 * Clicking one will show its details on the right.
 * @param {Array} hymns  array of occurrence objects
 */
function renderHymnList(hymns) {
  const list = document.getElementById("wordList");
  list.innerHTML = "";
  hymns.forEach(o => {
    const div = document.createElement("div");
    div.className = "word-item";
    div.textContent = `Hymn ${o.hymn_number}, Verse ${o.verse_number} – ${o.hymn_title}`;
    div.onclick = () => {
      // display that single occurrence
      const det = document.getElementById("details");
      const raw = document.getElementById("search").value;
      det.innerHTML = `
        <h2>Hymn ${o.hymn_number}, Verse ${o.verse_number}</h2>
        <p>[Known: ${o.known}, Organ: ${o.organ}, AVT: ${o.avt}]</p>
        <p>${highlight(o.verse_text, raw)}</p>
      `;
    };
    list.appendChild(div);
  });
}

/** Render a given array of word keys into the left pane */
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

/** When a word is clicked, show its hymn occurrences */
function showDetails(word) {
  console.log("👁️ showDetails for", word);
  const det = document.getElementById("details");
  det.innerHTML = `<h2>${word.toUpperCase()}</h2>`;

  concordance[word].occurrences.forEach(o => {
    const p = document.createElement("p");
    p.innerHTML = `
      <strong>Hymn ${o.hymn_number}, Verse ${o.verse_number}</strong><br>
      [Known: ${o.known}, Organ: ${o.organ}, AVT: ${o.avt}]<br>
      ${highlight(o.verse_text, document.getElementById("search").value)}
    `;
    det.appendChild(p);
  });
}

/** Filter the word list by the search term */
function applyFilter() {
  console.log("🔍 applyFilter() fired");
  const raw   = document.getElementById("search").value.trim().toLowerCase();
  const terms = raw.split(/\s+/).filter(t => t);
  const all   = document.getElementById("matchAll").checked;

  // If “match all” + multiple terms, do a hymn-level search
  if (all && terms.length > 1) {
    const hymns = findHymnsMatchingAll(terms);
    renderHymnList(hymns);
    document.getElementById("details").innerHTML = "";
    return;
  }

  // Otherwise, back to word-list “any term” logic
  const keys = Object.keys(concordance);
  const matches = terms.length === 0
    ? keys
    : keys.filter(w =>
        // match any of the terms in the word key
        terms.some(t => w.includes(t))
      );

  renderList(matches);
  document.getElementById("details").innerHTML = "";
}

  renderList(matches);
  document.getElementById("details").innerHTML = "";
}

/** Highlight each occurrence of the term within the verse text */
function highlight(text, raw) {
  if (!raw) return text;

  // split into terms again
  const terms = raw.trim().toLowerCase().split(/\s+/).filter(t => t);
  let out = text;

  terms.forEach(term => {
    const re = new RegExp(`(${term})`, "gi");
    out = out.replace(re, `<span class="highlight">$1</span>`);
  });

  return out;
}

// Wire up once the DOM is ready
// Wire up once the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const searchBtn   = document.querySelector("button");

  // 1️⃣ Click on Search button
  searchBtn.onclick = applyFilter;

  // 2️⃣ Press Enter in the input
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();    // prevent any default form behavior
      applyFilter();         // fire the same filter logic
    }
  });

  // Load and render full concordance on start
  loadData();
});
