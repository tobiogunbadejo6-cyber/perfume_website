const ADMIN_TOKEN_KEY = "aunty_perfume_admin_token";
const LAST_SEEN_ORDER_KEY = "kettyscent_last_seen_order";
let orderPollIntervalId = null;
let latestOrdersCache = [];

function getToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function removeToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function adminHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`
  };
}

function toggleAdminViews(isLoggedIn) {
  document.getElementById("admin-login-view")?.classList.toggle("hidden", isLoggedIn);
  document.getElementById("admin-dashboard-view")?.classList.toggle("hidden", !isLoggedIn);
}

function adminCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN"
  }).format(amount);
}

async function loadOverview() {
  const overview = await API.request("/admin/overview", {
    headers: adminHeaders()
  });

  document.getElementById("metric-products").textContent = overview.totalProducts;
  document.getElementById("metric-orders").textContent = overview.totalOrders;
  document.getElementById("metric-pending").textContent = overview.pendingOrders;
  document.getElementById("metric-delivered").textContent = overview.deliveredOrders;
}

function fillProductForm(product = null) {
  const form = document.getElementById("product-form");
  form.reset();

  form.elements.productId.value = product?._id || "";
  form.elements.name.value = product?.name || "";
  form.elements.price.value = product?.price || "";
  form.elements.imageUrl.value = product?.imageUrl || "";
  form.elements.description.value = product?.description || "";
  form.elements.category.value = product?.category || "Unisex";
  form.elements.featured.checked = Boolean(product?.featured);

  document.getElementById("product-form-title").textContent = product ? "Edit Perfume" : "Add Perfume";
  document.getElementById("product-submit").textContent = product ? "Update Product" : "Add Product";
}

async function loadProductsTable() {
  const products = await API.request("/products");
  const tableBody = document.getElementById("admin-products-table");

  tableBody.innerHTML = products.map((product) => `
    <tr class="border-b border-white/5">
      <td class="px-4 py-4">
        <div class="flex items-center gap-3">
          <img src="${product.imageUrl}" alt="${product.name}" class="h-14 w-14 rounded-2xl object-cover" />
          <div>
            <p class="font-medium text-white">${product.name}</p>
            <p class="text-sm text-white/55">${product.category}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-4 text-white/70">${adminCurrency(product.price)}</td>
      <td class="px-4 py-4 text-white/70">${product.featured ? "Featured" : "Standard"}</td>
      <td class="px-4 py-4">
        <div class="flex gap-2">
          <button data-edit-product="${product._id}" class="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-[var(--luxury-gold)] hover:text-gold">Edit</button>
          <button data-delete-product="${product._id}" class="rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/10">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-edit-product]").forEach((button) => {
    button.addEventListener("click", async () => {
      const product = await API.request(`/products/${button.dataset.editProduct}`);
      fillProductForm(product);
      document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  document.querySelectorAll("[data-delete-product]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("Delete this perfume?")) {
        return;
      }

      await API.request(`/products/${button.dataset.deleteProduct}`, {
        method: "DELETE",
        headers: adminHeaders()
      });

      await refreshAdminData();
    });
  });
}

async function loadOrdersTable() {
  const search = document.getElementById("order-search-input")?.value?.trim();
  const orders = await API.request(`/orders${search ? `?search=${encodeURIComponent(search)}` : ""}`, {
    headers: adminHeaders()
  });
  latestOrdersCache = orders;

  const tableBody = document.getElementById("admin-orders-table");
  if (!orders.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-8 text-center text-white/55">No orders found for that search.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = orders.map((order) => `
    <tr class="border-b border-white/5 align-top">
      <td class="px-4 py-4 text-white/70">#${order._id}</td>
      <td class="px-4 py-4">
        <p class="font-medium text-white">${order.customerName}</p>
        <p class="mt-1 text-sm text-white/55">${order.phone}</p>
      </td>
      <td class="px-4 py-4 text-white/70">${order.address}</td>
      <td class="px-4 py-4 text-white/70">
        ${order.items.map((item) => `<div>${item.name} x ${item.quantity}</div>`).join("")}
      </td>
      <td class="px-4 py-4 text-white/70">${adminCurrency(order.totalAmount)}</td>
      <td class="px-4 py-4">
        <span class="status-pill ${order.status === "Delivered" ? "status-delivered" : "status-pending"}">${order.status}</span>
      </td>
      <td class="px-4 py-4">
        <div class="flex flex-wrap gap-2">
          ${order.whatsappNotificationUrl
            ? `<a href="${order.whatsappNotificationUrl}" target="_blank" rel="noreferrer" class="rounded-full border border-green-500/30 px-4 py-2 text-sm text-green-200 transition hover:bg-green-500/10">WhatsApp</a>`
            : ""}
          <a href="mailto:kettyscent@gmail.com?subject=Order%20${order._id}&body=Customer:%20${encodeURIComponent(order.customerName)}" class="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-[var(--luxury-gold)] hover:text-gold">Email</a>
          ${order.status === "Delivered"
            ? '<span class="self-center text-sm text-white/45">Completed</span>'
            : `<button data-deliver-order="${order._id}" class="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110">Mark Delivered</button>`}
        </div>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-deliver-order]").forEach((button) => {
    button.addEventListener("click", async () => {
      await API.request(`/orders/${button.dataset.deliverOrder}/deliver`, {
        method: "PATCH",
        headers: adminHeaders()
      });

      await refreshAdminData();
    });
  });

  updateLastSeenOrder(orders[0]);
}

async function refreshAdminData() {
  await Promise.all([loadOverview(), loadProductsTable(), loadOrdersTable()]);
}

function updateLastSeenOrder(order) {
  if (!order) {
    return;
  }

  const currentSeen = localStorage.getItem(LAST_SEEN_ORDER_KEY);
  if (!currentSeen) {
    localStorage.setItem(LAST_SEEN_ORDER_KEY, String(order._id));
  }
}

function showNewOrderAlert(order) {
  const shell = document.getElementById("new-order-alert-shell");
  const title = document.getElementById("new-order-alert-title");
  const body = document.getElementById("new-order-alert-body");
  const whatsappLink = document.getElementById("new-order-alert-whatsapp");

  if (!shell || !title || !body || !whatsappLink || !order) {
    return;
  }

  title.textContent = `New order #${order._id} from ${order.customerName}`;
  body.textContent = `${order.items.length} item(s), ${adminCurrency(order.totalAmount)}, ${order.phone}`;
  whatsappLink.href = order.whatsappNotificationUrl || "#";
  whatsappLink.classList.toggle("hidden", !order.whatsappNotificationUrl);
  shell.classList.remove("hidden");
}

function hideNewOrderAlert() {
  document.getElementById("new-order-alert-shell")?.classList.add("hidden");
}

async function checkForNewOrders() {
  try {
    const orders = await API.request("/orders", {
      headers: adminHeaders()
    });

    if (!orders.length) {
      return;
    }

    const latestOrder = orders[0];
    const lastSeenOrderId = localStorage.getItem(LAST_SEEN_ORDER_KEY);

    if (lastSeenOrderId && String(latestOrder._id) !== String(lastSeenOrderId)) {
      showNewOrderAlert(latestOrder);
      await refreshAdminData();
    }

    localStorage.setItem(LAST_SEEN_ORDER_KEY, String(latestOrder._id));
  } catch (_error) {
    // Ignore polling errors so the admin page stays usable.
  }
}

function setupLogin() {
  const loginForm = document.getElementById("admin-login-form");
  if (!loginForm) {
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const result = await API.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    setToken(result.token);
    toggleAdminViews(true);
    await refreshAdminData();
  });
}

function setupProductForm() {
  const form = document.getElementById("product-form");
  if (!form) {
    return;
  }

  fillProductForm();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const productId = formData.get("productId");
    const payload = {
      name: formData.get("name"),
      price: Number(formData.get("price")),
      imageUrl: formData.get("imageUrl"),
      description: formData.get("description"),
      category: formData.get("category"),
      featured: formData.get("featured") === "on"
    };

    await API.request(productId ? `/products/${productId}` : "/products", {
      method: productId ? "PUT" : "POST",
      headers: adminHeaders(),
      body: JSON.stringify(payload)
    });

    fillProductForm();
    await refreshAdminData();
  });
}

function setupLogout() {
  document.getElementById("admin-logout")?.addEventListener("click", () => {
    clearInterval(orderPollIntervalId);
    removeToken();
    toggleAdminViews(false);
  });
}

function setupOrderSearch() {
  const searchInput = document.getElementById("order-search-input");
  const resetButton = document.getElementById("order-search-reset");

  if (!searchInput || !resetButton) {
    return;
  }

  searchInput.addEventListener("input", async () => {
    await loadOrdersTable();
  });

  resetButton.addEventListener("click", async () => {
    searchInput.value = "";
    await loadOrdersTable();
  });
}

function setupAlerts() {
  document.getElementById("dismiss-new-order-alert")?.addEventListener("click", hideNewOrderAlert);
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("admin-page")) {
    return;
  }

  setupLogin();
  setupProductForm();
  setupLogout();
  setupOrderSearch();
  setupAlerts();

  const loggedIn = Boolean(getToken());
  toggleAdminViews(loggedIn);

  if (loggedIn) {
    try {
      await refreshAdminData();
      clearInterval(orderPollIntervalId);
      orderPollIntervalId = setInterval(checkForNewOrders, 30000);
    } catch (_error) {
      removeToken();
      toggleAdminViews(false);
    }
  }
});
