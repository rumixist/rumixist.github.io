// assets/js/signup.js (güncellenmiş, dayanıklı)
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
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Signing up...";

    // timeout wrapper
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

    try {
      const res = await fetch(`${BASE}/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Eğer CORS hatası varsa fetch ya hata fırlatır (caught’a düşer) veya res.ok false olur
      let payload;
      try { payload = await res.json(); } catch (e) { payload = { error: await res.text().catch(()=> String(e)) }; }

      if (!res.ok) {
        // 401, 400, 409 vs durumları buradan yönet
        const message = payload?.error || payload?.message || `Signup failed (status ${res.status})`;
        alert(message);
        return;
      }

      alert("Signup başarılı — otomatik olarak giriş yapıldı.");
      form.reset();
      window.location.href = "/index.html";
    } catch (err) {
      if (err.name === "AbortError") {
        alert("Sunucu yanıt vermedi (timeout). Ağ bağlantını veya fonksiyon loglarını kontrol et.");
      } else {
        console.error("Signup fetch error:", err);
        alert("Bir hata oluştu. Konsolu kontrol et (DevTools).");
      }
    } finally {
      clearTimeout(timeoutId);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
