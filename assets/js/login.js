// assets/js/login.js
const BASE = "https://cklqydolfzwskptbmvpb.functions.supabase.co";

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      let payload;
      try { payload = await res.json(); } catch { payload = { error: await res.text().catch(()=> "Unknown") }; }

      if (!res.ok) {
        alert("Giriş başarısız: " + (payload?.error || "Unknown"));
        return;
      }

      // Token'ı localStorage'a kaydet
      if (payload?.token) {
        localStorage.setItem("session_token", payload.token);
      }

      alert("Giriş başarılı!");
      window.location.href = "/index.html"; // veya ana sayfanızın adresi
    } catch (err) {
      console.error(err);
      alert("Giriş sırasında bir hata oluştu. Konsolu kontrol edin.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = orig;
    }
  });
});