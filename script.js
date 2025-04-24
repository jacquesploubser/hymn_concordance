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
  const term = document.getElementById("search")
                     .value
                     .trim()
                     .toLowerCase();

  // Build a filtered array of word keys
  const matches = Object.keys(concordance)
    .filter(w => w.includes(term));

  // Re-render the list with only matching words
  renderList(matches);

  // Clear the details pane when new filter is applied
  document.getElementById("details").innerHTML = "";
}

/** Highlight each occurrence of the term within the verse text */
function highlight(text, term) {
  if (!term) return text;
  const re = new RegExp(`(${term})`, "gi");
  return text.replace(re, `<span class="highlight">$1</span>`);
}

// Wire up once the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Attach the Search button (first <button> in the page)
  document.querySelector("button").onclick = applyFilter;
  loadData();
});
