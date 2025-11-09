// Get the Generate Routine button
const generateBtn = document.getElementById("generateRoutine");

// Conversation history for chat
let chatHistory = [
  {
    role: "system",
    content:
      "You are a helpful skincare and beauty advisor. Only answer questions about the generated routine, skincare, haircare, makeup, fragrance, or related beauty topics. If asked about anything else, politely say you can only answer beauty-related questions.",
  },
];

// Handler for generating personalized routine
generateBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML =
      '<div class="placeholder-message">Please select at least one product to generate a routine.</div>';
    return;
  }

  // Prepare product data and add to chat history
  const productData = selectedProducts.map(
    ({ name, brand, category, description }) => ({
      name,
      brand,
      category,
      description,
    })
  );
  chatHistory = [
    chatHistory[0], // system prompt
    {
      role: "user",
      content: `Here are my selected products: ${JSON.stringify(productData)}`,
    },
  ];

  chatWindow.innerHTML =
    '<div class="placeholder-message">Generating your personalized routine...</div>';

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory }),
    });
    const data = await response.json();
    const routine =
      data.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a routine.";
    chatHistory.push({ role: "assistant", content: routine });
    chatWindow.innerHTML = `<div class='ai-response'>${routine.replace(
      /\n/g,
      "<br>"
    )}</div>`;
  } catch (err) {
    chatWindow.innerHTML = `<div class='placeholder-message'>Error generating routine. Please try again.</div>`;
  }
});
/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

const workerURL = "https://square-hill-a227.jacobbaskiewicz.workers.dev/";

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

// Store all loaded products for search/filter
let allProducts = [];
/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return data.products;
}

// Track selected products by their id, load from localStorage if available
let selectedProducts = [];
const SELECTED_PRODUCTS_KEY = "selectedProducts";
try {
  const saved = localStorage.getItem(SELECTED_PRODUCTS_KEY);
  if (saved) selectedProducts = JSON.parse(saved);
} catch {}

// Render product cards and enable selection
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card${
      selectedProducts.some((p) => p.id === product.id) ? " selected" : ""
    }" data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <button class="desc-toggle-btn" title="Show description" aria-expanded="false" style="position:absolute;top:10px;right:10px;background:#fffdfa;border:1.5px solid #e3a535;color:#e3a535;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:1.1em;z-index:3;box-shadow:0 2px 8px 0 rgba(227,165,53,0.10);"><i class='fa fa-info'></i></button>
      <div class="product-desc-overlay" style="display:none;">
        <div class="desc-content">${product.description}</div>
        <button class="desc-close-btn" title="Close" aria-label="Close description" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#ff003b;font-size:1.3em;cursor:pointer;"><i class='fa fa-times'></i></button>
      </div>
    </div>
  `
    )
    .join("");

  // Add click event to each card
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Prevent toggling selection if clicking description toggle or close
      if (
        e.target.closest(".desc-toggle-btn") ||
        e.target.closest(".desc-close-btn")
      )
        return;
      const id = Number(card.getAttribute("data-id"));
      const product = products.find((p) => p.id === id);
      const index = selectedProducts.findIndex((p) => p.id === id);
      if (index === -1) {
        selectedProducts.push(product);
      } else {
        selectedProducts.splice(index, 1);
      }
      displayProducts(products); // re-render to update selection
      renderSelectedProducts();
      // Save to localStorage
      try {
        localStorage.setItem(
          SELECTED_PRODUCTS_KEY,
          JSON.stringify(selectedProducts)
        );
      } catch {}
    });
    // Toggle description overlay
    const descBtn = card.querySelector(".desc-toggle-btn");
    const overlay = card.querySelector(".product-desc-overlay");
    const closeBtn = card.querySelector(".desc-close-btn");
    descBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (overlay.style.display === "flex") {
        overlay.style.display = "none";
        descBtn.setAttribute("aria-expanded", "false");
      } else {
        overlay.style.display = "flex";
        descBtn.setAttribute("aria-expanded", "true");
      }
    });
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.style.display = "none";
      descBtn.setAttribute("aria-expanded", "false");
    });
  });
}

// Render selected products in the list
function renderSelectedProducts() {
  const list = document.getElementById("selectedProductsList");
  if (selectedProducts.length === 0) {
    list.innerHTML =
      '<div class="placeholder-message">No products selected</div>';
    // Remove clear button if present
    const clearBtn = document.getElementById("clearSelectedBtn");
    if (clearBtn) clearBtn.remove();
    return;
  }
  list.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-product-item" data-id="${product.id}">
          <img src="${product.image}" alt="${product.name}" style="width:40px;height:40px;object-fit:contain;border-radius:6px;margin-right:8px;vertical-align:middle;">
          <span style="font-weight:600;color:#ff003b;">${product.name}</span>
          <span style="color:#e3a535;margin-left:6px;">${product.brand}</span>
          <button class="remove-selected" title="Remove" style="margin-left:10px;background:none;border:none;color:#ff003b;font-size:1.2em;cursor:pointer;vertical-align:middle;"><i class="fa fa-times-circle"></i></button>
        </div>
      `
    )
    .join("");

  // Add clear all button if not present
  if (!document.getElementById("clearSelectedBtn")) {
    const clearBtn = document.createElement("button");
    clearBtn.id = "clearSelectedBtn";
    clearBtn.textContent = "Clear All";
    clearBtn.style =
      "margin:12px 0 0 0;padding:8px 18px;font-size:1em;background:#fffdfa;border:1.5px solid #e3a535;color:#e3a535;border-radius:6px;cursor:pointer;float:right;";
    clearBtn.onclick = () => {
      selectedProducts = [];
      try {
        localStorage.removeItem(SELECTED_PRODUCTS_KEY);
      } catch {}
      renderSelectedProducts();
      // Also update grid
      const currentProducts = Array.from(
        document.querySelectorAll(".product-card")
      ).map((card) => ({
        id: Number(card.getAttribute("data-id")),
        name: card.querySelector("h3").textContent,
        brand: card.querySelector("p").textContent,
        image: card.querySelector("img").src,
      }));
      displayProducts(currentProducts);
    };
    list.parentElement.appendChild(clearBtn);
  }

  // Remove button event
  document.querySelectorAll(".remove-selected").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const parent = btn.closest(".selected-product-item");
      const id = Number(parent.getAttribute("data-id"));
      selectedProducts = selectedProducts.filter((p) => p.id !== id);
      try {
        localStorage.setItem(
          SELECTED_PRODUCTS_KEY,
          JSON.stringify(selectedProducts)
        );
      } catch {}
      // Also unselect in grid
      const currentProducts = Array.from(
        document.querySelectorAll(".product-card")
      ).map((card) => Number(card.getAttribute("data-id")));
      // If grid is showing, update selection
      if (currentProducts.includes(id)) {
        const products = Array.from(
          document.querySelectorAll(".product-card")
        ).map((card) => ({
          id: Number(card.getAttribute("data-id")),
          name: card.querySelector("h3").textContent,
          brand: card.querySelector("p").textContent,
          image: card.querySelector("img").src,
        }));
        displayProducts(products);
      }
      renderSelectedProducts();
    });
  });
  // Save to localStorage
  try {
    localStorage.setItem(
      SELECTED_PRODUCTS_KEY,
      JSON.stringify(selectedProducts)
    );
  } catch {}
}

// Product search and category filter logic
const productSearch = document.getElementById("productSearch");
let currentCategory = "";
let currentSearch = "";

function filterAndDisplayProducts() {
  let filtered = allProducts;
  if (currentCategory) {
    filtered = filtered.filter((p) => p.category === currentCategory);
  }
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }
  displayProducts(filtered);
}

categoryFilter.addEventListener("change", async (e) => {
  currentCategory = e.target.value;
  if (allProducts.length === 0) await loadProducts();
  filterAndDisplayProducts();
});

productSearch.addEventListener("input", async (e) => {
  currentSearch = e.target.value;
  if (allProducts.length === 0) await loadProducts();
  filterAndDisplayProducts();
});

// On page load, load products for search and show selected products
window.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  renderSelectedProducts();
});

// Chat form submission handler for follow-up questions
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = chatForm.querySelector("input");
  const userMsg = input.value.trim();
  if (!userMsg) return;

  // Add user message to chat history
  chatHistory.push({ role: "user", content: userMsg });
  chatWindow.innerHTML = '<div class="placeholder-message">Thinking...</div>';

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory }),
    });
    const data = await response.json();
    const answer =
      data.choices?.[0]?.message?.content || "Sorry, I couldn't answer that.";
    chatHistory.push({ role: "assistant", content: answer });
    chatWindow.innerHTML = `<div class='ai-response'>${answer.replace(
      /\n/g,
      "<br>"
    )}</div>`;
  } catch (err) {
    chatWindow.innerHTML = `<div class='placeholder-message'>Error. Please try again.</div>`;
  }
  input.value = "";
});
