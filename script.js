// ===== Supabase Connection =====
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"; // Replace with your Supabase URL
const SUPABASE_KEY = "YOUR_PUBLIC_ANON_KEY"; // Replace with your anon key
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== Global State =====
let items = [];
let isAdmin = false;

// ===== Fetch Items =====
async function loadItems() {
  const { data, error } = await supabase.from("items").select("*").order("name", { ascending: true });
  if (error) {
    console.error("Error fetching data:", error);
    return;
  }

  items = data;
  renderItems(items);
}

// ===== Render Items in Table =====
function renderItems(items) {
  const tbody = document.getElementById("items-body");
  tbody.innerHTML = "";

  items.forEach(item => {
    const row = document.createElement("tr");
    row.classList.add("border-t", "border-gray-700", "hover:bg-gray-800", "cursor-pointer");
    row.innerHTML = `
      <td class="p-3 font-medium">${item.name}</td>
      <td class="p-3">${item.type}</td>
      <td class="p-3">${item.rarity}</td>
      <td class="p-3">${item.attunement}</td>
    `;
    row.addEventListener("click", () => showDescription(item));
    tbody.appendChild(row);
  });
}

// ===== Show Item Description =====
function showDescription(item) {
  alert(`${item.name}\n\n${item.description || "No description available."}`);
}

// ===== Filters =====
document.getElementById("typeFilter").addEventListener("change", applyFilters);
document.getElementById("rarityFilter").addEventListener("change", applyFilters);
document.getElementById("attunementFilter").addEventListener("change", applyFilters);

function applyFilters() {
  const type = document.getElementById("typeFilter").value;
  const rarity = document.getElementById("rarityFilter").value;
  const attunement = document.getElementById("attunementFilter").value;

  const filtered = items.filter(item =>
    (type ? item.type === type : true) &&
    (rarity ? item.rarity === rarity : true) &&
    (attunement ? item.attunement === attunement : true)
  );
  renderItems(filtered);
}

// ===== Admin Login Modal =====
const loginBtn = document.getElementById("login-btn");
const loginModal = document.getElementById("login-modal");
const loginSubmit = document.getElementById("login-submit");
const loginCancel = document.getElementById("login-cancel");
const adminSection = document.getElementById("admin-section");

loginBtn.addEventListener("click", () => {
  loginModal.classList.remove("hidden");
});

loginCancel.addEventListener("click", () => {
  loginModal.classList.add("hidden");
});

loginSubmit.addEventListener("click", () => {
  const username = document.getElementById("admin-username").value;
  const password = document.getElementById("admin-password").value;

  // Replace with your own credentials
  if (username === "admin" && password === "1234") {
    isAdmin = true;
    loginModal.classList.add("hidden");
    adminSection.classList.remove("hidden");
    alert("Logged in as admin!");
  } else {
    alert("Invalid credentials.");
  }
});

// ===== Add Item Form =====
document.getElementById("add-item-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isAdmin) return alert("Unauthorized");

  const newItem = {
    name: document.getElementById("name").value,
    type: document.getElementById("type").value,
    rarity: document.getElementById("rarity").value,
    attunement: document.getElementById("attunement").value,
    description: document.getElementById("description").value
  };

  const { error } = await supabase.from("items").insert([newItem]);
  if (error) {
    console.error("Error adding item:", error);
    alert("Failed to add item.");
    return;
  }

  alert("Item added successfully!");
  e.target.reset();
  loadItems();
});

// ===== Init =====
loadItems();
