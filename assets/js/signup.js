// assets/js/signup.js
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
    const confirmPassword = document.getElementById("confirm_password").value;

    if (!username || !password) {
      alert("Lütfen kullanıcı adı ve şifre girin.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Şifreler uyuşmuyor.");
      return;
    }

    submitBtn.disabled = true;
    const orig = submitBtn.textContent;
    submitBtn.textContent = "Signing up...";

    // timeout için AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`${BASE}/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      let payload;
      try { payload = await res.json(); } catch (e) { payload = { error: await res.text().catch(()=>"Unknown") }; }

      if (!res.ok) {
        alert("Signup failed: " + (payload?.error || "Unknown"));
        return;
      }

      alert("Kayıt başarılı — giriş yapıldı.");
      form.reset();
      window.location.href = "/index.html";
    } catch (err) {
      if (err.name === "AbortError") {
        alert("İstek zaman aşımına uğradı. Tekrar deneyin.");
      } else {
        console.error(err);
        alert("Bir hata oluştu. Konsolu kontrol et.");
      }
    } finally {
      clearTimeout(timeout);
      submitBtn.disabled = false;
      submitBtn.textContent = orig;
    }
  });
});
