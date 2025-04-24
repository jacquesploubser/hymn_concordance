// script.js

let concordance = {};

async function loadData() {
  const res = await fetch("concordance.json");
  concordance = await res.json();
  renderList(Object.keys(concordance));
}

function renderList(words) {
  const list = document.getElementById("wordList");
  list.innerHTML = "";
  words.forEach(w => {
    const div = document.createElement("div");
    div.textContent = `${w.toUpperCase()} (${concordance[w].count})`;
    div.onclick = () => showDetails(w);
    list.append(div);
  });
}

function showDetails(word) {
  const det = document.getElementById("details");
  det.innerHTML = `<h2>${word.toUpperCase()}</h2>`;
  const entries = concordance[word].occurrences;
  entries.forEach(o => {
    let p = document.createElement("p");
    p.innerHTML = `<strong>Hymn ${o.hymn_number}, Verse ${o.verse_number}</strong><br>
                   [Known: ${o.known}, Organ: ${o.organ}, AVT: ${o.avt}]<br>
                   ${highlight(o.verse_text, document.getElementById("search").value)}`;
    det.append(p);
  });
}

function applyFilter() {
  const term = document.getElementById("search").value.toLowerCase();
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

// on load
window.onload = loadData;
