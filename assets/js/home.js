// assets/js/home.js
const BASE = "https://sgqlutjpejcusnfyajkm.functions.supabase.co";

document.addEventListener("DOMContentLoaded", async () => {
  const greeting = document.getElementById("greetingtext");
  if (!greeting) return;

  // Başta gizle, sonra duruma göre göster
  greeting.style.display = "none";

  try {
    const res = await fetch(`${BASE}/me`, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      // Oturum yok veya unauthorized
      greeting.style.display = "none";
      return;
    }

    // JSON parse dene
    let data;
    try { data = await res.json(); } catch { data = null; }

    const username = data?.user?.username;
    if (username) {
      greeting.textContent = `Welcome, ${username}`;
      greeting.style.display = "block";
    } else {
      greeting.style.display = "none";
    }
  } catch (err) {
    console.error("Error fetching /me:", err);
    greeting.style.display = "none";
  }
});
