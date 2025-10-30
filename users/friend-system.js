// friend-system.js
// Tam çalışan, tek dosya halindeki sürüm.
// Kullanım: <script src="friend-system.js"></script>
// Not: API_BASE'i kendi functions URL'inle değiştir.

(function () {
  // ---------- CONFIG ----------
  let API_BASE = "https://jneuwkadlgoxekhcbvdh.functions.supabase.co"; // <-- değiştir
  const TOKEN_KEYS_TO_CHECK = [
    "supabase.auth.token",
    "supabase.auth.session",
    "sb:token",
    "supabase:auth-token",
    "auth.token",
    "token"
  ];

  const SELECTORS = { addBtn: "#add-friend", actionBtn: "#reject-request" };
  const ENDPOINTS = {
    status: "/friend-status",
    send: "/friend-request",
    cancel: "/friend-request-cancel",
    respond: "/friend-request-respond",
    unfriend: "/friendship-unfriend",
    count: "/friend-count"
  };

  // ---------- STATE ----------
  let otherUserId = null;
  let token = null;
  let currentState = "loading"; // loading | not_friends | request_sent | request_received | friends | self

  // ---------- HELPERS ----------
  function log(...args) { console.log("[FriendSystem]", ...args); }

  function getTokenFromLocalStorage() {
    try {
      for (const key of TOKEN_KEYS_TO_CHECK) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.access_token) return parsed.access_token;
          if (parsed?.token) return parsed.token;
          if (parsed?.currentSession?.access_token) return parsed.currentSession.access_token;
          if (parsed?.accessToken) return parsed.accessToken;
        } catch (e) {
          if (typeof raw === "string" && raw.trim().length > 10) return raw;
        }
      }
    } catch (e) {
      console.warn("Token retrieval failed:", e);
    }
    if (window?.AUTH_TOKEN) return window.AUTH_TOKEN;
    return null;
  }

  // JWT payload'ını signature doğrulaması olmadan parse eder (UI amaçlı).
  function parseJwtPayload(jwt) {
    try {
      if (!jwt || typeof jwt !== "string") return null;
      const parts = jwt.split(".");
      if (parts.length < 2) return null;
      let payload = parts[1];
      // base64url -> base64
      payload = payload.replace(/-/g, "+").replace(/_/g, "/");
      // pad
      while (payload.length % 4) payload += "=";
      const decoded = atob(payload);
      // JSON parse
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }

  function buildUrl(path, query) {
    const base = API_BASE.replace(/\/+$/, "");
    const p = path.startsWith("/") ? path : "/" + path;
    const url = new URL(base + p);
    if (query) {
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }
    return url.toString();
  }

  async function apiFetch(method, endpoint, body = null, query = null) {
    const url = buildUrl(endpoint, query);
    if (!token) token = getTokenFromLocalStorage();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) { /* non-json allowed */ }
    if (!res.ok) {
      const message = (json && (json.error || json.message)) || text || res.statusText;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return json ?? text;
  }

  function el(sel) { return document.querySelector(sel); }

  function getOtherUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? Number(id) : null;
  }

  function showLoginHint() {
    if (confirm("Bu işlemi yapmak için giriş yapmalısınız. Giriş sayfasına gidilsin mi?")) {
      window.location.href = "/login";
    }
  }

  // ---------- UI RENDER ----------
  function render() {
    const addBtn = el(SELECTORS.addBtn);
    const actionBtn = el(SELECTORS.actionBtn);
    if (!addBtn || !actionBtn) {
      log("Butonlar bulunamadı. SELECTORS'ı kontrol et.");
      return;
    }

    // default hide
    addBtn.style.display = "none";
    actionBtn.style.display = "none";

    if (currentState === "self") {
      // Kendi profili: hiçbir işlem butonu gösterme
      addBtn.style.display = "none";
      actionBtn.style.display = "none";
      return;
    }

    switch (currentState) {
      case "loading":
        addBtn.style.display = "none";
        actionBtn.style.display = "none";
        break;
      case "not_friends":
        addBtn.style.display = "";
        addBtn.disabled = false;
        addBtn.textContent = "Send Request";
        actionBtn.style.display = "none";
        break;
      case "request_sent":
        addBtn.style.display = "none";
        actionBtn.style.display = "";
        actionBtn.disabled = false;
        actionBtn.textContent = "Cancel Request";
        break;
      case "request_received":
        addBtn.style.display = "";
        addBtn.disabled = false;
        addBtn.textContent = "Accept";
        actionBtn.style.display = "";
        actionBtn.disabled = false;
        actionBtn.textContent = "Reject";
        break;
      case "friends":
        addBtn.style.display = "none";
        actionBtn.style.display = "";
        actionBtn.disabled = false;
        actionBtn.textContent = "Unfriend";
        break;
      default:
        addBtn.style.display = "none";
        actionBtn.style.display = "none";
    }
  }

  function setBusy(b) {
    const addBtn = el(SELECTORS.addBtn);
    const actionBtn = el(SELECTORS.actionBtn);
    if (addBtn) addBtn.disabled = b;
    if (actionBtn) actionBtn.disabled = b;
  }

  // ---------- API HELPERS ----------
  async function fetchStatus() {
    return await apiFetch("GET", ENDPOINTS.status, null, { other_id: otherUserId });
  }
  async function sendRequest() { return await apiFetch("POST", ENDPOINTS.send, { requested_id: otherUserId }); }
  async function cancelRequest() { return await apiFetch("POST", ENDPOINTS.cancel, { requested_id: otherUserId }); }
  async function respondRequest(action) { return await apiFetch("POST", ENDPOINTS.respond, { requester_id: otherUserId, action }); }
  async function unfriend() { return await apiFetch("POST", ENDPOINTS.unfriend, { other_user_id: otherUserId }); }

  // ---------- FRIEND COUNT ----------
  async function fetchFriendCount(profileId) {
  try {
    const json = await apiFetch("GET", `${ENDPOINTS.count}?id=${profileId}`);
    return json && typeof json.count === "number" ? json.count : 0;
  } catch (err) {
    console.error("Friend count fetch error:", err);
    return 0;
  }
}

async function updateFriendCountUI() {
  const elFriends = document.querySelector("#friends");
  if (!elFriends) return;

  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get("id");   // Profil sayfasındaki id parametresi
  const count = await fetchFriendCount(profileId);

  elFriends.textContent = `${count} Friends`;
}

  // ---------- STATE REFRESH ----------
  async function refreshState() {
    // Eğer kendi profilindeysek: state = self ve backend sorgusuna gitme
    if (await isViewingOwnProfile()) {
      currentState = "self";
      render();
      return;
    }

    try {
      setBusy(true);
      const res = await fetchStatus();
      if (res && res.state) currentState = res.state;
      else currentState = "not_friends";
    } catch (err) {
      if (err && err.status === 401) {
        // token geçersiz veya yok
        TOKEN_KEYS_TO_CHECK.forEach(k => localStorage.removeItem(k));
        token = null;
        currentState = "not_friends";
      } else {
        console.error("refreshState hata:", err);
        currentState = "not_friends";
      }
    } finally {
      setBusy(false);
      render();
    }
  }

  // ---------- EVENTS ----------
  function attachEvents() {
    const addBtn = el(SELECTORS.addBtn);
    const actionBtn = el(SELECTORS.actionBtn);
    if (!addBtn || !actionBtn) {
      log("Butonlar attach edilmedi. SELECTORS'ı kontrol et.");
      return;
    }

    addBtn.addEventListener("click", async () => {
      if (currentState === "self") return; // ekstra güvenlik
      if (!token) { showLoginHint(); return; }
      try {
        setBusy(true);
        if (currentState === "not_friends") await sendRequest();
        else if (currentState === "request_received") await respondRequest("accept");
        await refreshState();
        await updateFriendCountUI();
      } catch (err) {
        if (err && err.status === 401) showLoginHint();
        else { alert("İşlem sırasında hata: " + (err.message || err)); console.error(err); }
      } finally { setBusy(false); }
    });

    actionBtn.addEventListener("click", async () => {
      if (currentState === "self") return;
      if (!token) { showLoginHint(); return; }
      try {
        setBusy(true);
        if (currentState === "request_sent") await cancelRequest();
        else if (currentState === "request_received") await respondRequest("reject");
        else if (currentState === "friends") {
          if (!confirm("Are you sure to unfriend this person?")) return;
          await unfriend();
        }
        await refreshState();
        await updateFriendCountUI();
      } catch (err) {
        if (err && err.status === 401) showLoginHint();
        else { alert("İşlem sırasında hata: " + (err.message || err)); console.error(err); }
      } finally { setBusy(false); }
    });
  }

  // ---------- UTILITY: kendi profil kontrolu ----------
  async function isViewingOwnProfile() {
    // 1) Eğer token yoksa kesin değil -> false
    if (!token) token = getTokenFromLocalStorage();
    if (!token) return false;

    // 2) JWT payload'tan sub al (uygulama /me endpoint'ine çağrı yerine)
    const payload = parseJwtPayload(token);
    if (!payload) return false;
    const myId = payload.sub ? Number(payload.sub) : null;
    if (!myId) return false;
    return Number(otherUserId) === myId;
  }

  // ---------- INIT ----------
  async function init(opts = {}) {
    if (opts.apiBase) API_BASE = opts.apiBase.replace(/\/+$/, "");
    otherUserId = opts.otherUserId ? Number(opts.otherUserId) : getOtherUserIdFromUrl();
    if (!otherUserId) {
      console.warn("Profil URL'sinden otherUserId alınamadı. FriendSystem başlatılmadı.");
      return;
    }
    token = getTokenFromLocalStorage();

    attachEvents();
    currentState = "loading";
    render();

    // refresh durum ve friend-count paralel çalıştırılabilir
    await Promise.all([ refreshState(), updateFriendCountUI() ]);
  }

  // expose
  window.FriendSystem = { init };

  // auto init unless manual flag set
  document.addEventListener("DOMContentLoaded", () => {
    if (!window.__FRIEND_SYSTEM_MANUAL_INIT) FriendSystem.init();
  });

})(); // end IIFE

// ---------- Friends Button ----------
document.addEventListener("DOMContentLoaded", () => {
  const friendsElement = document.getElementById("friends");

  friendsElement.addEventListener("click", () => {
    // URL'deki parametreyi al
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id");

    if (userId) {
      window.location.href = `/users/friends/?id=${userId}`;
    } else {
      console.warn("Profil ID bulunamadı!");
    }
  });
});
