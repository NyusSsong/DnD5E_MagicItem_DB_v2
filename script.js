let items = [];
let filteredItems = [];

const searchInput = document.getElementById("search");
const filterType = document.getElementById("filter-type");
const filterRarity = document.getElementById("filter-rarity");
const filterAttunement = document.getElementById("filter-attunement");
const sortButton = document.getElementById("sort-alpha");
const resultsBody = document.querySelector("#results tbody");

let sortAscending = true;

// Load items
async function loadItems() {
  const res = await fetch("data/items.json");
  items = await res.json();
  populateFilters();
  applyFilters();
}

// Populate filters
function populateFilters() {
  const types = [...new Set(items.map(item => item.type))];
  const rarities = [...new Set(items.map(item => item.rarity))];
  const attunements = [...new Set(items.map(item => item.attunement))];

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

  attunements.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    filterAttunement.appendChild(opt);
  });
}

// Render items as rows
function renderItems(data) {
  resultsBody.innerHTML = "";
  if (data.length === 0) {
    resultsBody.innerHTML = "<tr><td colspan='4'>No items found.</td></tr>";
    return;
  }

  data.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.type}</td>
      <td>${item.rarity}</td>
      <td>${item.attunement}</td>
    `;

    tr.addEventListener("click", () => openModal(item));
    resultsBody.appendChild(tr);
  });
}

// Modal setup
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", e => { if(e.target === modal) closeModal(); });

function openModal(item) {
  document.getElementById("modal-title").textContent = item.name;
  document.getElementById("modal-meta").innerHTML = `
    <span class="meta-item"><strong>Type:</strong> ${item.type}</span>
    <span class="meta-item"><strong>Rarity:</strong> ${item.rarity}</span>
    <span class="meta-item"><strong>Attunement:</strong> ${item.attunement}</span>
  `;
  document.getElementById("modal-description").textContent = item.description;
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

// Filter & sort
function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const typeVal = filterType.value;
  const rarityVal = filterRarity.value;
  const attuneVal = filterAttunement.value;

  filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search);
    const matchesType = typeVal === "" || item.type === typeVal;
    const matchesRarity = rarityVal === "" || item.rarity === rarityVal;
    const matchesAttune = attuneVal === "" || item.attunement === attuneVal;
    return matchesSearch && matchesType && matchesRarity && matchesAttune;
  });

  filteredItems.sort((a,b) => sortAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  renderItems(filteredItems);
}

// Event listeners
searchInput.addEventListener("input", applyFilters);
filterType.addEventListener("change", applyFilters);
filterRarity.addEventListener("change", applyFilters);
filterAttunement.addEventListener("change", applyFilters);
sortButton.addEventListener("click", () => {
  sortAscending = !sortAscending;
  sortButton.textContent = sortAscending ? "Sort A–Z" : "Sort Z–A";
  applyFilters();
});

loadItems();
