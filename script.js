/* ===== Supabase Setup ===== */
const SUPABASE_URL = "https://mcsyppddpfdwszjujvdb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jc3lwcGRkcGZkd3N6anVqdmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODEwMDQsImV4cCI6MjA3NTY1NzAwNH0.baTeknh36nwbn3PFV_CNGt-3aTD7QYo12mI1cxn6iZw";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ===== Global Variables ===== */
let items = [];
let filteredItems = [];
let sortAscending = true;
let session = null;

/* ===== DOM Elements ===== */
const searchInput = document.getElementById("search");
const filterType = document.getElementById("filter-type");
const filterRarity = document.getElementById("filter-rarity");
const filterAttunement = document.getElementById("filter-attunement");
const sortButton = document.getElementById("sort-alpha");
const resultsBody = document.querySelector("#results tbody");

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const addItemBtn = document.getElementById("add-item-btn");

/* ---------- Load Items ---------- */
async function loadItems() {
  try {
    const { data, error } = await supabaseClient.from("items").select("*").order("name", { ascending: true });
    if (error) throw error;
    items = data || [];
    populateFilters();
    applyFilters();
  } catch (err) {
    console.error(err);
    resultsBody.innerHTML = "<tr><td colspan='4'>Error loading items.</td></tr>";
  }
}

/* ---------- Populate Filters ---------- */
function populateFilters() {
  filterType.querySelectorAll("option:not(:first-child)").forEach(o => o.remove());
  filterRarity.querySelectorAll("option:not(:first-child)").forEach(o => o.remove());

  const types = [...new Set(items.map(i => i.type).filter(Boolean))].sort();
  const rarities = [...new Set(items.map(i => i.rarity).filter(Boolean))].sort((a,b) => rarityOrder(a) - rarityOrder(b));

  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t; opt.textContent = t;
    filterType.appendChild(opt);
  });

  rarities.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r; opt.textContent = r;
    filterRarity.appendChild(opt);
  });
}

/* ---------- Rarity Sorting Helper ---------- */
function rarityOrder(r) {
  const order = {
    "Common": 1,
    "Uncommon": 2,
    "Rare": 3,
    "Very Rare": 4,
    "Legendary": 5,
    "Unique": 6,
    "Artifact": 7
  };
  return order[r] || 99;
}

/* ---------- Render Table ---------- */
function renderItems(data) {
  resultsBody.innerHTML = "";
  if (!data.length) {
    resultsBody.innerHTML = "<tr><td colspan='4'>No items found.</td></tr>";
    return;
  }

  data.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.type)}</td>
      <td>${escapeHtml(item.rarity)}</td>
      <td>${escapeHtml(item.attunement)}</td>
    `;
    tr.addEventListener("click", () => openModal(item));
    resultsBody.appendChild(tr);
  });
}

/* ---------- Filters ---------- */
function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const type = filterType.value;
  const rarity = filterRarity.value;
  const attune = filterAttunement.value;

  filteredItems = items.filter(i =>
    (!search || i.name.toLowerCase().includes(search)) &&
    (!type || i.type === type) &&
    (!rarity || i.rarity === rarity) &&
    (!attune || i.attunement === attune)
  );

  filteredItems.sort((a, b) =>
    sortAscending
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
  );

  renderItems(filteredItems);
}

/* ---------- Modal Display ---------- */
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");

function openModal(item) {
  document.getElementById("modal-title").textContent = item.name;
  document.getElementById("modal-meta").innerHTML = `
    <span><strong>Type:</strong> ${escapeHtml(item.type)}</span>
    <span><strong>Rarity:</strong> ${escapeHtml(item.rarity)}</span>
    <span><strong>Attunement:</strong> ${escapeHtml(item.attunement)}</span>
  `;
  document.getElementById("modal-description").innerHTML = marked.parse(item.description || "");
  modal.style.display = "flex";
}

modalClose.addEventListener("click", () => modal.style.display = "none");
modal.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

/* ---------- Utility ---------- */
function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}

/* ---------- Sorting ---------- */
sortButton.addEventListener("click", () => {
  sortAscending = !sortAscending;
  sortButton.textContent = sortAscending ? "Sort A–Z" : "Sort Z–A";
  applyFilters();
});

/* ---------- Search and Filters ---------- */
searchInput.addEventListener("input", applyFilters);
filterType.addEventListener("change", applyFilters);
filterRarity.addEventListener("change", applyFilters);
filterAttunement.addEventListener("change", applyFilters);

/* ---------- Auth Modals ---------- */
const loginModal = document.getElementById("login-modal");
const loginSubmit = document.getElementById("login-submit");
const loginCancel = document.getElementById("login-cancel");

loginBtn.addEventListener("click", () => loginModal.classList.remove("hidden"));
loginCancel.addEventListener("click", () => loginModal.classList.add("hidden"));

loginSubmit.addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return alert("Login failed: " + error.message);

  session = data.session;
  loginModal.classList.add("hidden");
  updateAuthUI();
});

/* ---------- Logout ---------- */
logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  session = null;
  updateAuthUI();
});

/* ---------- Add Item Modal ---------- */
const addItemModal = document.getElementById("add-item-modal");
const itemSubmit = document.getElementById("item-submit");
const itemCancel = document.getElementById("item-cancel");

addItemBtn.addEventListener("click", () => addItemModal.classList.remove("hidden"));
itemCancel.addEventListener("click", () => addItemModal.classList.add("hidden"));

itemSubmit.addEventListener("click", async () => {
  const name = document.getElementById("item-name").value.trim();
  const type = document.getElementById("item-type").value.trim();
  const rarity = document.getElementById("item-rarity").value;
  const attunement = document.getElementById("item-attunement").value;
  const description = document.getElementById("item-description").value.trim();

  if (!name || !type || !rarity || !attunement)
    return alert("Please fill all required fields.");

  const { error } = await supabaseClient.from("items").insert([{ name, type, rarity, attunement, description }]);
  if (error) return alert("Failed to add item: " + error.message);

  alert("Item added!");
  addItemModal.classList.add("hidden");
  loadItems();
});

/* ---------- Session Handling ---------- */
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  session = data.session;
  updateAuthUI();
}

function updateAuthUI() {
  const loggedIn = !!session;
  addItemBtn.classList.toggle("hidden", !loggedIn);
  logoutBtn.classList.toggle("hidden", !loggedIn);
  loginBtn.classList.toggle("hidden", loggedIn);
}

/* ---------- Init ---------- */
checkSession();
loadItems();
