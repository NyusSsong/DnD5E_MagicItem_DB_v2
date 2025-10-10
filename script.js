const SUPABASE_URL = "https://mcsyppddpfdwszjujvdb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jc3lwcGRkcGZkd3N6anVqdmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODEwMDQsImV4cCI6MjA3NTY1NzAwNH0.baTeknh36nwbn3PFV_CNGt-3aTD7QYo12mI1cxn6iZw";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const searchInput = document.getElementById("search");
const filterType = document.getElementById("filter-type");
const filterRarity = document.getElementById("filter-rarity");
const filterAttunement = document.getElementById("filter-attunement");
const sortButton = document.getElementById("sort-alpha");
const resultsBody = document.querySelector("#results tbody");

let items = [];
let filteredItems = [];
let sortAscending = true;  // ✅ FIX: Declare this variable

/* ---------- Load items from Supabase ---------- */
async function loadItems() {
  try {
    const { data, error } = await supabaseClient.from("items").select("*");

    if (error) {
      console.error("Supabase error:", error);
      resultsBody.innerHTML = `<tr><td colspan="4">Error loading data.</td></tr>`;
      return;
    }

    items = Array.isArray(data) ? data : [];
    items = items.map(i => ({ ...i, attunement: (i.attunement || "").toString() }));

    populateFilters();
    applyFilters();
  } catch (err) {
    console.error("Fetch failed:", err);
    resultsBody.innerHTML = `<tr><td colspan="4">Network error.</td></tr>`;
  }
}

/* ---------- Populate filters ---------- */
function populateFilters() {
  filterType.querySelectorAll("option:not(:first-child)").forEach(n => n.remove());
  filterRarity.querySelectorAll("option:not(:first-child)").forEach(n => n.remove());

  const types = [...new Set(items.map(i => i.type || "").filter(Boolean))].sort();
  const rarities = [...new Set(items.map(i => i.rarity || "").filter(Boolean))].sort();

  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    filterType.appendChild(opt);
  });

  rarities.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    filterRarity.appendChild(opt);
  });
}

/* ---------- Render table rows ---------- */
function renderItems(data) {
  resultsBody.innerHTML = "";
  if (!data || data.length === 0) {
    resultsBody.innerHTML = "<tr><td colspan='4'>No items found.</td></tr>";
    return;
  }

  data.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(item.name || "")}</td>
      <td>${escapeHtml(item.type || "")}</td>
      <td>${escapeHtml(item.rarity || "")}</td>
      <td>${escapeHtml(item.attunement || "")}</td>
    `;
    tr.addEventListener("click", () => openModal(item));
    resultsBody.appendChild(tr);
  });
}

/* ---------- Modal ---------- */
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

function openModal(item) {
  document.getElementById("modal-title").textContent = item.name || "";
  document.getElementById("modal-meta").innerHTML = `
    <span class="meta-item"><strong>Type:</strong> ${escapeHtml(item.type || "")}</span>
    <span class="meta-item"><strong>Rarity:</strong> ${escapeHtml(item.rarity || "")}</span>
    <span class="meta-item"><strong>Attunement:</strong> ${escapeHtml(item.attunement || "")}</span>
  `;
  document.getElementById("modal-description").innerHTML = marked.parse(item.description || "");
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

/* ---------- Filters + sorting ---------- */
function applyFilters() {
  const search = (searchInput.value || "").toLowerCase().trim();
  const typeVal = filterType.value || "";
  const rarityVal = filterRarity.value || "";
  const attuneVal = filterAttunement.value || "";

  filteredItems = items.filter(i => {
    const matchesSearch = (i.name || "").toLowerCase().includes(search);
    const matchesType = typeVal === "" || (i.type || "") === typeVal;
    const matchesRarity = rarityVal === "" || (i.rarity || "") === rarityVal;
    const matchesAttune = attuneVal === "" || (i.attunement || "") === attuneVal;
    return matchesSearch && matchesType && matchesRarity && matchesAttune;
  });

  filteredItems.sort((a, b) =>
    sortAscending
      ? (a.name || "").localeCompare(b.name || "")
      : (b.name || "").localeCompare(a.name || "")
  );

  renderItems(filteredItems);
}

/* ---------- Utilities ---------- */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------- Event listeners ---------- */
searchInput.addEventListener("input", applyFilters);
filterType.addEventListener("change", applyFilters);
filterRarity.addEventListener("change", applyFilters);
filterAttunement.addEventListener("change", applyFilters);

sortButton.addEventListener("click", () => {
  sortAscending = !sortAscending;
  sortButton.textContent = sortAscending ? "Sort A–Z" : "Sort Z–A";
  applyFilters();
});

/* ---------- Start ---------- */
loadItems();
