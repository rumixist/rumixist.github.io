// Updated home.js for new homepage layout
const BASE = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

document.addEventListener("DOMContentLoaded", async () => {
    // JS updated: mobile alert control added
const greeting = document.getElementById("greetingtext");
    const alertContainer = document.querySelector(".alert-container");
    const navLoginBtnLi = document.querySelector("li.login-button");

    const token = localStorage.getItem("token");
    const localUsername = localStorage.getItem("currentUsername");

    if (navLoginBtnLi) navLoginBtnLi.style.display = "none";

    // Logged in
    if (token && localUsername) {
        if (greeting) {
            greeting.textContent = getGreetingMessage(localUsername);
            greeting.style.display = "block";
        }

        // Hide only login-required alert
        const loginAlert = document.querySelector('.alert-box.login-required');
        if (loginAlert) loginAlert.style.display = "none";

        // Hide mobile alert if user is on desktop
        const mobileAlert = document.querySelector('.alert-box.mobile-warning');
        if (mobileAlert && !isMobile()) mobileAlert.style.display = "none";
        if (loginAlert) loginAlert.style.display = "none";

    } else {
        // Not logged in
        if (navLoginBtnLi) navLoginBtnLi.style.display = "block";
        if (greeting) greeting.style.display = "none";

        // Show proper alerts when logged out
        const loginAlert = document.querySelector('.alert-box.login-required');
        if (loginAlert) loginAlert.style.display = "block";

        const mobileAlert = document.querySelector('.alert-box.mobile-warning');
        if (mobileAlert) mobileAlert.style.display = isMobile() ? "block" : "none";
        if (loginAlert) loginAlert.style.display = "block";
    }
});

function isMobile() {
    return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

function getGreetingMessage(username) {
    const hour = new Date().getHours();
    let message = "Welcome";

    if (hour >= 5 && hour < 12) {
        message = "Good Morning";
    } else if (hour >= 12 && hour < 17) {
        message = "Good Afternoon";
    } else if (hour >= 17 && hour < 21) {
        message = "Good Evening";
    } else {
        message = "Good Night";
    }

    return `${message}, ${username}!`;
}

// home.js — sağlam, hata-dirençli updateFriendsAndRequests
(async function () {
  const API_BASE = 'https://jneuwkadlgoxekhcbvdh.functions.supabase.co';

  // Güvenli fetch + çeşitli dönüş biçimlerine dayanıklı parse
  async function safeFetchJSON(url, opts = {}) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) {
        console.error('API hata:', url, res.status, res.statusText);
        return [];
      }
      const json = await res.json();
      if (!json) return [];
      if (Array.isArray(json)) return json;
      if (Array.isArray(json.data)) return json.data;
      if (Array.isArray(json.items)) return json.items;
      if (Array.isArray(json.results)) return json.results;
      // Bazı API'ler doğrudan {rows: [...]}
      if (json.rows && Array.isArray(json.rows)) return json.rows;
      // Eğer tek bir nesne döndü ise ve kullanıcı listesi bekleniyorsa boş dizi döndür
      return [];
    } catch (err) {
      console.error('safeFetchJSON error for', url, err);
      return [];
    }
  }

  // Kullanıcı nesnesinden id ve username'i güvenli seç
  function extractUserInfo(u) {
    if (!u) return { id: null, username: 'unknown' };
    const id = u.id ?? u.user_id ?? u.userid ?? u._id ?? null;
    const username = u.username ?? u.name ?? u.user ?? u.display_name ?? 'unknown';
    return { id, username };
  }

  // Render: her kullanıcı ayrı <span class="friend-item">, aralarda virgül
  function renderList(containerEl, list) {
    containerEl.innerHTML = '';

    if (!Array.isArray(list) || list.length === 0) {
      // Boşsa basit kullanıcı dostu mesaj
      const p = document.createElement('p');
      p.className = 'empty-message';
      p.textContent = 'empty';
      containerEl.appendChild(p);
      return;
    }

    const fragment = document.createDocumentFragment();

    list.forEach((u, idx) => {
      const { id, username } = extractUserInfo(u);

      const span = document.createElement('span');
      span.className = 'friend-item';
      span.textContent = username;
      if (id !== null) span.dataset.userid = id;

      // erişilebilirlik için
      span.setAttribute('role', 'link');
      span.setAttribute('tabindex', '0');

      // tıklama handler
      span.addEventListener('click', () => {
        if (span.dataset.userid) {
          window.location.href = `/users/?id=${encodeURIComponent(span.dataset.userid)}`;
        } else {
          console.warn('Profile id yok:', username);
        }
      });
      // klavye desteği (Enter)
      span.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          span.click();
        }
      });

      fragment.appendChild(span);

      // araya virgül (sonuncudan sonra yok)
      if (idx < list.length - 1) {
        fragment.appendChild(document.createTextNode(', '));
      }
    });

    containerEl.appendChild(fragment);
  }

  async function updateFriendsAndRequests() {
    const friendsListEl = document.querySelector('.friends-list');
    const requestsListEl = document.querySelector('.requests-list');

    if (!friendsListEl || !requestsListEl) {
      console.warn('friends-list veya requests-list elementleri bulunamadı.');
      return;
    }

    const token = localStorage.getItem('token');
    const username = localStorage.getItem('currentUsername');

    // Giriş yoksa basit mesajlar
    if (!token || !username) {
      friendsListEl.innerHTML = '<p>Log in to see friends</p>';
      requestsListEl.innerHTML = '<p>Log in to see requests</p>';
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Parallel çağrı, zaman kazandırır
      const [friends, requests] = await Promise.all([
        safeFetchJSON(`${API_BASE}/friends-list`, { headers }),
        safeFetchJSON(`${API_BASE}/friend-requests-list`, { headers }),
      ]);

      // Render et (JS artık See more butonu oluşturmaz)
      renderList(friendsListEl, friends);
      renderList(requestsListEl, requests);

      // Eğer bir container tamamen boşsa (No items) ise parent'taki HTML'de yer alan
      // "See more" butonunu gizlemek istersen burada kontrol edebilirsin.
      // (Kullanıcı HTML'de .see-more-friends ve .see-more-requests id/class koymuş olmalı)
      const seeMoreFriends = document.querySelector('.see-more-friends');
      const seeMoreRequests = document.querySelector('.see-more-requests');

      if (seeMoreFriends) {
        const friendsEmpty = !Array.isArray(friends) || friends.length === 0;
        seeMoreFriends.style.display = friendsEmpty ? 'none' : 'inline-block';
      }
      if (seeMoreRequests) {
        const reqEmpty = !Array.isArray(requests) || requests.length === 0;
        seeMoreRequests.style.display = reqEmpty ? 'none' : 'inline-block';
      }

    } catch (err) {
      console.error('updateFriendsAndRequests hata:', err);
      friendsListEl.textContent = 'Error loading friends';
      requestsListEl.textContent = 'Error loading requests';
    }
  }

  // Başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateFriendsAndRequests);
  } else {
    updateFriendsAndRequests();
  }

  // (İsteğe bağlı) Eğer sayfada kullanıcılar dinamik olarak değişiyorsa, dışarıdan çağrı için export-like:
  window.updateFriendsAndRequests = updateFriendsAndRequests;
})();

document.addEventListener("DOMContentLoaded", function () {

    // Buraya istediğin kadar içerik ekleyebilirsin
    // title = başlık, text = içerik
    const infoItems = [
      {
          title: "Did you know",
          text: "Your brain can read a whole sentence, understand it, judge it, and forget it in under three seconds. Perfect skill for ignoring responsibilities."
      },
      {
          title: "Mini Story",
          text: "Tom opened his fridge to think. Not to eat. Just to think. The cold air hit him with more clarity than his entire education."
      },
      {
          title: "Tiny Philosophy",
          text: "If you wait for the perfect moment, the perfect moment will wait for you too. Both of you will stare at each other forever, doing nothing."
      },
      {
          title: "Cosmic Joke",
          text: "You live on a spinning rock traveling through space at 107.000 km/h. And yet someone cutting in line still ruins your day."
      },
      {
          title: "Strange Observation",
          text: "Nobody teaches clouds how to look dramatic, but they absolutely mastered the skill. Meanwhile humans need tutorials for everything."
      },
      {
          title: "Soft Reminder",
          text: "You're allowed to rest. Even your phone gets a reboot. And it's literally metal and electricity."
      },
      {
          title: "Absurd Reality",
          text: "You only have one body, yet you treat it like a rental car you got full insurance on."
      },
      {
          title: "Unexpected Wisdom",
          text: "Even a paused video is technically moving at the speed of light. So maybe you're not the only one faking productivity."
      },
      {
          title: "Deep Shower Thought",
          text: "Your future self is basically a stranger you're trying to impress by making good decisions. Good luck with that."
      },
  ];


    // 12 saatlik global periyot numarası
    // 12 saat = 12 * 60 * 60 * 1000 ms
    const period = 12 * 60 * 60 * 1000;
    const globalIndex = Math.floor(Date.now() / period) % infoItems.length;

    const selected = infoItems[globalIndex];

    const titleElement = document.querySelector(".dynamic-title");
    const contentElement = document.querySelector(".dynamic-content");

    if (titleElement) titleElement.textContent = selected.title;

    if (contentElement) {
        contentElement.innerHTML = "";
        const li = document.createElement("li");
        li.textContent = selected.text;
        contentElement.appendChild(li);
    }
});

// JS
document.addEventListener("DOMContentLoaded", () => {
  const link = document.getElementById("see-more-friends");
  const currentUserId = localStorage.getItem("currentUserId");
  console.log("currentUserId:", currentUserId);

  if (currentUserId && link) {
    link.href = `/users/friends/?id=${currentUserId}`;
  } else {
    console.error("currentUserId yok ya da link elementi bulunamadı");
  }
});
