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
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    submitBtn.disabled = true;
    const orig = submitBtn.textContent;
    submitBtn.textContent = "Logging in...";

    try {
      const res = await fetch(`${BASE}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      let payload;
      try { payload = await res.json(); } catch { payload = { error: await res.text().catch(()=> "Unknown") }; }

      if (!res.ok) {
        alert("Login failed: " + (payload?.error || "Unknown"));
        return;
      }

      alert("Giriş başarılı!");
      window.location.href = "/index.html";
    } catch (err) {
      console.error(err);
      alert("Giriş sırasında hata oluştu.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = orig;
    }
  });
});
