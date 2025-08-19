// assets/js/home.js
const BASE = "https://cklqydolfzwskptbmvpb.functions.supabase.co";

document.addEventListener("DOMContentLoaded", async () => {
  const greeting = document.getElementById("greetingtext");
  const loginBtnLi = document.querySelector("li.login-button");
  const navUl = document.querySelector("nav ul");

  if (greeting) greeting.style.display = "none";
  const token = localStorage.getItem("session_token");

  if (!token) {
    // Token yoksa giriş butonu görünür olsun
    if (loginBtnLi) loginBtnLi.style.display = "";
    return;
  }

  try {
    const res = await fetch(`${BASE}/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      localStorage.removeItem("session_token"); // Geçersiz token'ı temizle
      if (loginBtnLi) loginBtnLi.style.display = "";
      return;
    }

    const data = await res.json();
    const username = data?.user?.username;

    if (username) {
      if (greeting) {
        greeting.textContent = `Welcome, ${username}`;
        greeting.style.display = "block";
      }
      if (loginBtnLi) loginBtnLi.style.display = "none";

      if (navUl && !document.getElementById("nav-profile")) {
        const profileLi = document.createElement("li");
        profileLi.id = "nav-profile";
        profileLi.innerHTML = `<a href="/profile.html">Profile</a>`;
        navUl.appendChild(profileLi);

        const settingsLi = document.createElement("li");
        settingsLi.id = "nav-settings";
        settingsLi.innerHTML = `<a href="/settings.html">Settings</a>`;
        navUl.appendChild(settingsLi);

        const logoutLi = document.createElement("li");
        logoutLi.id = "nav-logout";
        logoutLi.innerHTML = `<a href="#" id="logout-link">Logout</a>`;
        navUl.appendChild(logoutLi);

        document.getElementById("logout-link").addEventListener("click", (e) => {
          e.preventDefault();
          localStorage.removeItem("session_token");
          window.location.reload();
        });
      }
    }
  } catch (err) {
    console.error("Error fetching /me:", err);
    localStorage.removeItem("session_token"); // Hata durumunda token'ı temizle
    if (loginBtnLi) loginBtnLi.style.display = "";
  }
});