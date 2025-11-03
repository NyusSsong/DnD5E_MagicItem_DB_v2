// ===== Supabase Setup =====
const SUPABASE_URL = "https://mcsyppddpfdwszjujvdb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jc3lwcGRkcGZkd3N6anVqdmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODEwMDQsImV4cCI6MjA3NTY1NzAwNH0.baTeknh36nwbn3PFV_CNGt-3aTD7QYo12mI1cxn6iZw";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== DOM Elements =====
const searchInput = document.getElementById("search");
const filterType = document.getElementById("filter-type");
const filterRarity = document.getElementById("filter-rarity");
const filterAttunement = document.getElementById("filter-attunement");
const sortButton = document.getElementById("sort-alpha");
const resultsBody = document.querySelector("#results tbody");

const modal = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");

const addItemCard = document.getElementById("add-item-card");
const openAddCardBtn = document.getElementById("open-add-card");
const cancelAddBtn = document.getElementById("cancel-item");
const submitItemBtn = document.getElementById("submit-item");

const loginModal = document.getElementById("login-modal");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginSubmit = document.getElementById("login-submit");
const loginCancel = document.getElementById("login-cancel");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");

// ===== Global State =====
let items = [];
let filteredItems = [];
let sortAscending = true;
let user = null;

// ===== Load Items =====
async function loadItems() {
  try {
    const { data, error } = await supabaseClient.from("items").select("*");
    if (error) throw error;
    items = Array.isArray(data) ? data : [];
    items = items.map(i => ({ ...i, attunement: (i.attunement || "").toString() }));
    populateFilters();
    applyFilters();
  } catch (err) {
    console.error("Fetch failed:", err);
    resultsBody.innerHTML = "<tr><td colspan='4'>Network error.</td></tr>";
  }
}

// ===== Populate Type + Rarity + Attunement Filters =====
function populateFilters() {
  // Types dynamic
  filterType.querySelectorAll("option:not(:first-child)").forEach(n => n.remove());
  const types = [...new Set(items.map(i => (i.type || "").replace(/\s*\(.*\)/, "")).filter(Boolean))].sort();
  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    filterType.appendChild(opt);
  });

  // Rarities fixed
  const rarities = ["Common","Uncommon","Rare","Very Rare","Legendary","Artifact","Unique"];
  filterRarity.querySelectorAll("option:not(:first-child)").forEach(n => n.remove());
  rarities.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    filterRarity.appendChild(opt);
  });
}

// ===== Render Table =====
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

// ===== Modal =====
modalClose.addEventListener("click", () => modal.style.display = "none");
modal.addEventListener("click", e => { if(e.target===modal) modal.style.display="none"; });

function openModal(item){
  document.getElementById("modal-title").textContent = item.name || "";
  document.getElementById("modal-meta").innerHTML = `
    <span class="meta-item"><strong>Type:</strong> ${escapeHtml(item.type || "")}</span>
    <span class="meta-item"><strong>Rarity:</strong> ${escapeHtml(item.rarity || "")}</span>
    <span class="meta-item"><strong>Attunement:</strong> ${escapeHtml(item.attunement || "")}</span>
  `;
  document.getElementById("modal-description").innerHTML = marked.parse(item.description || "");
  modal.style.display = "flex";
}

// ===== Filters + Sort =====
function applyFilters(){
  const search = (searchInput.value || "").toLowerCase().trim();
  const typeVal = filterType.value || "";
  const rarityVal = filterRarity.value || "";
  const attuneVal = filterAttunement.value || "";

  filteredItems = items.filter(i => {
    const matchesSearch = search === "" || 
      (i.name || "").toLowerCase().includes(search) ||
      (i.type || "").toLowerCase().includes(search);
    const matchesType = typeVal === "" || (i.type || "").toLowerCase().includes(typeVal.toLowerCase());
    const matchesRarity = rarityVal === "" || (i.rarity||"")===rarityVal;
    const matchesAttune = attuneVal === "" || (i.attunement||"")===attuneVal;
    return matchesSearch && matchesType && matchesRarity && matchesAttune;
  });

  filteredItems.sort((a,b)=>
    sortAscending
      ? (a.name||"").localeCompare(b.name||"")
      : (b.name||"").localeCompare(a.name||"")
  );
  renderItems(filteredItems);
}

// ===== Escape HTML =====
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ===== Event Listeners =====
searchInput.addEventListener("input", applyFilters);
filterType.addEventListener("change", applyFilters);
filterRarity.addEventListener("change", applyFilters);
filterAttunement.addEventListener("change", applyFilters);
sortButton.addEventListener("click", ()=>{
  sortAscending=!sortAscending;
  sortButton.textContent=sortAscending?"Sort A–Z":"Sort Z–A";
  applyFilters();
});

// ===== Login / Logout =====
loginBtn.addEventListener("click", ()=> loginModal.style.display="flex");
loginCancel.addEventListener("click", ()=> loginModal.style.display="none");
loginModal.addEventListener("click", e => { if(e.target===loginModal) loginModal.style.display="none"; });

loginSubmit.addEventListener("click", async ()=>{
  loginError.textContent = "";
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: loginEmail.value,
      password: loginPassword.value
    });
    if(error) throw error;
    user = data.user;
    loginModal.style.display = "none";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    openAddCardBtn.style.display = "inline-block";
  } catch(err) {
    console.error(err);
    loginError.textContent = "Login failed. Check your credentials.";
  }
});

logoutBtn.addEventListener("click", async ()=>{
  await supabaseClient.auth.signOut();
  user=null;
  loginBtn.style.display="inline-block";
  logoutBtn.style.display="none";
  openAddCardBtn.style.display="none";
});

// ===== Add Item Card =====
openAddCardBtn.addEventListener("click", ()=>addItemCard.style.display="flex");
cancelAddBtn.addEventListener("click", ()=>addItemCard.style.display="none");
addItemCard.addEventListener("click", e=>{ if(e.target===addItemCard) addItemCard.style.display="none"; });

submitItemBtn.addEventListener("click", async ()=>{
  if(!user) return alert("You must be logged in to add items.");

  const newItem = {
    name: document.getElementById("add-name").value.trim(),
    type: document.getElementById("add-type").value.trim(),
    rarity: document.getElementById("add-rarity").value,
    attunement: document.getElementById("add-attunement").value,
    description: document.getElementById("add-description").value.trim()
  };
  if(!newItem.name || !newItem.type || !newItem.rarity || !newItem.attunement){
    return alert("Please fill all required fields.");
  }

  try {
    const { error } = await supabaseClient.from("items").insert([newItem]);
    if(error) throw error;
    // Reset form
    document.getElementById("add-name").value="";
    document.getElementById("add-type").value="";
    document.getElementById("add-rarity").value="";
    document.getElementById("add-attunement").value="";
    document.getElementById("add-description").value="";
    addItemCard.style.display="none";
    loadItems();
  } catch(err){
    console.error("Failed to add item:", err);
    alert("Failed to add item.");
  }
});

// ===== Init =====
loadItems();
