// script.js

console.log("✅ script.js loaded");

let concordance = {};

async function loadData() {
  try {
    const res = await fetch("concordance.json");
    concordance = await res.json();
    renderList(Object.keys(concordance));
  } catch (err) {
    console.error("Failed to load concordance.json:", err);
  }
}

function renderList(words) {
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
  const term = document.getElementById("search").value.trim().toLowerCase();
  const matches = Object.keys(concordance)
    .filter(w => w.includes(term));
  renderList(matches);
  document.getElementById("details").innerHTML = "";
}

function highlight(text, term) {
  if (!term) return text;
  const re = new RegExp(`(${term})`, "gi");
  return text.replace(re, `<span class="highlight">$1</span>`);
}

// Wire up the Search button and load on start
window.onload = () => {
  document.getElementById("searchBtn").onclick = applyFilter;
  loadData();
};
