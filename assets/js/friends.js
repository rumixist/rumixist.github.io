document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const urlParams = new URLSearchParams(window.location.search);
  const userIdParam = urlParams.get("id");

  if (!userIdParam) {
    console.error("Kullanıcı ID'si gerekli (?id=).");
    return;
  }

  const API_BASE = "https://jneuwkadlgoxekhcbvdh.functions.supabase.co";
  const PROFILE_BASE = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

  let currentUsername = "";

  // DOM
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const searchInput = document.getElementById("global-search");
  const titleEl = document.getElementById("friends-title");

  async function fetchAPI(endpoint) {
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("API hata: " + res.status);
      return await res.json();
    } catch (err) {
      console.error("API fetch error:", err);
      return [];
    }
  }

  async function fetchUsername(userId) {
    try {
      const res = await fetch(`${PROFILE_BASE}/profile?userId=${userId}`);
      if (!res.ok) throw new Error("Profil alınamadı");
      const data = await res.json();
      return data.username || "Someone";
    } catch (err) {
      console.error("Kullanıcı adı alınamadı:", err);
      return "Someone";
    }
  }

  function updateTitle() {
    if (!titleEl) return;

    const activeTab = document.querySelector(".tab-btn.active")?.dataset.tab;

    if (activeTab === "friends") {
      titleEl.textContent = `${currentUsername}'s Friends`;
    } else if (activeTab === "requests") {
      titleEl.textContent = `${currentUsername}'s Requests`;
    } else if (activeTab === "followers") {
      titleEl.textContent = `${currentUsername}'s Followers`;
    } else if (activeTab === "following") {
      titleEl.textContent = `${currentUsername} is Following`;
    }
  }

  function renderCards(container, list, type) {
    container.innerHTML = "";

    list.forEach((user) => {
      const card = document.createElement("div");
      card.className = "user-card";
      card.innerHTML = `
        <div class="avatar"></div>
        <div class="info">
          <p class="username">${user.username}</p>
        </div>
      `;

      card.addEventListener("click", () => {
        window.location.href = `/users/?id=${user.id}`;
      });

      if (type === "request") {
        const actions = document.createElement("div");
        actions.className = "actions";

        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = "Accept";
        acceptBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          respondRequest(user.id, "accept");
        });

        const rejectBtn = document.createElement("button");
        rejectBtn.textContent = "Reject";
        rejectBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          respondRequest(user.id, "reject");
        });

        actions.appendChild(acceptBtn);
        actions.appendChild(rejectBtn);
        card.appendChild(actions);
      }

      container.appendChild(card);
    });
  }

  async function loadFriends() {
    const endpoint = userIdParam
      ? `friends-list?id=${userIdParam}`
      : "friends-list";

    const friends = await fetchAPI(endpoint);
    const container = document.getElementById("friends");
    renderCards(container, friends, "friend");
  }

  async function loadRequests() {
    const requests = await fetchAPI("friend-requests-list");
    const container = document.getElementById("requests");
    renderCards(container, requests, "request");
  }

  async function respondRequest(otherId, action) {
    try {
      const res = await fetch(`${API_BASE}/friend-request-respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requester_id: otherId, action })
      });
      if (!res.ok) throw new Error("İstek yanıtlanamadı");
      await loadRequests();
      await loadFriends();
    } catch (err) {
      console.error("respondRequest error:", err);
    }
  }

  function setupSearch() {
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      const activeTab = document.querySelector(".tab-btn.active")?.dataset.tab;
      if (!activeTab) return;
      filterCards(activeTab, e.target.value);
    });
  }

  function filterCards(tabId, query) {
    const container = document.getElementById(tabId);
    if (!container) return;

    const cards = container.querySelectorAll(".user-card");
    cards.forEach((card) => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query.toLowerCase()) ? "block" : "none";
    });
  }

  // Tab switching
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      tabContents.forEach((c) => c.classList.add("hidden"));
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.remove("hidden");

      updateTitle();
    });
  });

  // Initialize
  loadFriends();
  loadRequests();
  setupSearch();

  // Kullanıcı adını çek ve başlığı güncelle
  fetchUsername(userIdParam).then((name) => {
    currentUsername = name;
    updateTitle();
  });
});
