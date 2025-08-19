// assets/js/login.js
const BASE = "https://sgqlutjpejcusnfyajkm.functions.supabase.co";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!submitBtn) return;

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      alert("Please fill in both fields.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    try {
      const res = await fetch(`${BASE}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      // Yanıtı önce JSON olarak almaya çalış, olmazsa metin oku
      let payload;
      try { payload = await res.json(); } catch { payload = { error: await res.text().catch(()=> "Unknown error") }; }

      if (!res.ok) {
        const msg = payload?.error || payload?.message || "Login failed";
        alert("Login failed: " + msg);
        return;
      }

      alert("Login successful!");
      // Yönlendir
      window.location.href = "/index.html";
    } catch (err) {
      console.error("Login error:", err);
      alert("An unexpected error occurred during login.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
    }
  });
});
