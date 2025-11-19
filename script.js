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

const loginModal = document.getElementById("login-modal");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginSubmit = document.getElementById("login-submit");
const loginCancel = document.getElementById("login-cancel");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");

const openFormCardBtn = document.getElementById("open-add-card");

// Unified Add/Edit Modal
const formModal = document.getElementById("form-item-modal");
const formTitle = document.getElementById("form-modal-title");
const formId = document.getElementById("form-item-id");
const formName = document.getElementById("form-name");
const formType = document.getElementById("form-type");
const formRarity = document.getElementById("form-rarity");
const formAttunement = document.getElementById("form-attunement");
const formDescription = document.getElementById("form-description");
const formSubmitBtn = document.getElementById("form-submit-btn");
const formDeleteBtn = document.getElementById("form-delete-btn");
const formCancelBtn = document.getElementById("form-cancel-btn");

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
    resultsBody.innerHTML = "<tr><td colspan='5'>Network error.</td></tr>";
  }
}

// ===== Populate Filters =====
function populateFilters() {
  // Type filter
  filterType.querySelectorAll("option:not(:first-child)").forEach(n => n.remove());
  const types = [...new Set(items.map(i => (i.type || "").replace(/\s*\(.*\)/, "")).filter(Boolean))].sort();
  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    filterType.appendChild(opt);
  });

  // Rarity filter
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
    resultsBody.innerHTML = "<tr><td colspan='5'>No items found.</td></tr>";
    return;
  }

  data.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(item.name || "")}</td>
      <td>${escapeHtml(item.type || "")}</td>
      <td>${escapeHtml(item.rarity || "")}</td>
      <td>${escapeHtml(item.attunement || "")}</td>
      <td class="actions-cell">
        ${user ? `<button class="edit-btn" data-id="${item.id}">✏️ Edit</button>` : ''}
      </td>
    `;

    // Row click → show details
    tr.querySelectorAll("td:not(.actions-cell)").forEach(td => {
      td.addEventListener("click", () => openModal(item));
    });

    // Edit button
    const editBtn = tr.querySelector(".edit-btn");
    if(editBtn) {
      editBtn.addEventListener("click", e => {
        e.stopPropagation();
        openFormModal(item);
      });
    }

    resultsBody.appendChild(tr);
  });
}

// ===== Modal Details =====
modalClose.addEventListener("click", () => modal.style.display = "none");
modal.addEventListener("click", e => { if(e.target === modal) modal.style.display = "none"; });

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

// ===== Filters & Sorting =====
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

  filteredItems.sort((a,b) =>
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

sortButton.addEventListener("click", () => {
  sortAscending = !sortAscending;
  sortButton.textContent = sortAscending ? "Sort A–Z" : "Sort Z–A";
  applyFilters();
});

// ===== Login / Logout =====
loginBtn.addEventListener("click", () => loginModal.style.display = "flex");
loginCancel.addEventListener("click", () => loginModal.style.display = "none");
loginModal.addEventListener("click", e => { if(e.target===loginModal) loginModal.style.display="none"; });

loginSubmit.addEventListener("click", async () => {
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
    openFormCardBtn.style.display = "inline-block";
    applyFilters();
  } catch(err){
    console.error(err);
    loginError.textContent = "Login failed. Check your credentials.";
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  user = null;
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
  openFormCardBtn.style.display = "none";
  applyFilters();
});

// ===== Open Add Item Modal =====
openFormCardBtn.addEventListener("click", () => openFormModal());

// ===== Unified Add/Edit Modal =====
function openFormModal(item = null) {
  if(item){
    // Editing
    formTitle.textContent = "Edit Item";
    formId.value = item.id;
    formName.value = item.name || "";
    formType.value = item.type || "";
    formRarity.value = item.rarity || "";
    formAttunement.value = item.attunement || "";
    formDescription.value = item.description || "";
    formDeleteBtn.style.display = "inline-block";
  } else {
    // Adding
    formTitle.textContent = "Add Item";
    formId.value = "";
    formName.value = "";
    formType.value = "";
    formRarity.value = "";
    formAttunement.value = "";
    formDescription.value = "";
    formDeleteBtn.style.display = "none";
  }
  formModal.style.display = "flex";
}

function closeFormModal(){ formModal.style.display = "none"; }

formCancelBtn.addEventListener("click", closeFormModal);
formModal.addEventListener("click", e => { if(e.target===formModal) closeFormModal(); });

// ===== Submit (Add / Update) =====
formSubmitBtn.addEventListener("click", async () => {
  if(!user) return alert("You must be logged in.");

  const itemData = {
    name: formName.value.trim(),
    type: formType.value.trim(),
    rarity: formRarity.value,
    attunement: formAttunement.value,
    description: formDescription.value.trim()
  };

  if(!itemData.name || !itemData.type || !itemData.rarity || !itemData.attunement){
    return alert("Please fill all required fields.");
  }

  try{
    if(formId.value){
      // Update
      const { error } = await supabaseClient
        .from("items")
        .update(itemData)
        .eq("id", formId.value);
      if(error) throw error;
      alert("Item updated!");
    } else {
      // Add
      const { error } = await supabaseClient
        .from("items")
        .insert([itemData]);
      if(error) throw error;
      alert("Item added!");
    }
    closeFormModal();
    loadItems();
  } catch(err){
    console.error(err);
    alert("Operation failed.");
  }
});

// ===== Delete =====
formDeleteBtn.addEventListener("click", async () => {
  if(!user) return alert("You must be logged in.");
  if(!confirm("Are you sure you want to delete this item?")) return;

  try{
    const { error } = await supabaseClient
      .from("items")
      .delete()
      .eq("id", formId.value);
    if(error) throw error;
    alert("Item deleted!");
    closeFormModal();
    loadItems();
  } catch(err){
    console.error(err);
    alert("Failed to delete item.");
  }
});

// ===== Init =====
loadItems();
