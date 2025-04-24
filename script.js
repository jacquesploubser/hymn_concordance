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
  // ...
}

function applyFilter() {
  // ...
}

function highlight(text, term) {
  // ...
}

// Replace window.onload with DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOM loaded, wiring up controls");
  document.getElementById("searchBtn").onclick = applyFilter;
  loadData();
});
