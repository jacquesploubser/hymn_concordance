// script.js

console.log("✅ script.js loaded");

let concordance = {};

async function loadData() {
  try {
    console.log("⏳ Fetching concordance.json...");
    const res = await fetch("concordance.json");
    console.log("📥 Fetch status:", res.status);
    
    concordance = await res.json();
    console.log("🔑 Parsed JSON; word count =", Object.keys(concordance).length);
    
    // sanity check: does the container exist?
    const listEl = document.getElementById("wordList");
    console.log("👀 wordList container:", listEl);
    
    // render
    renderList(Object.keys(concordance));
  } 
  catch (err) {
    console.error("❌ loadData error:", err);
  }
}

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

function applyFilter() {
  console.log("🔍 applyFilter() fired");
  const term = document.getElementById("search")
                     .value
                     .trim()
                     .toLowerCase();
  // Filter the word-keys
  const matches = Object.keys(concordance)
    .filter(w => w.toLowerCase().includes(term));
  // Re-render the list
  renderList(matches);
  // Clear any details pane
  document.getElementById("details").innerHTML = "";
}

function highlight(text, term) {
  if (!term) return text;
  // Wrap every match in <span class="highlight">
  const re = new RegExp(`(${term})`, "gi");
  return text.replace(re, `<span class="highlight">$1</span>`);
}

// Replace window.onload with DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  // no need for searchBtn
  document.querySelector("button").onclick = applyFilter;
  loadData();
});
