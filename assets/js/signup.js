const SUPABASE_API_URL = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1"; // Buraya Supabase URL'inizi girin
// Örneğin: https://<project-ref>.supabase.co/functions/v1/signup

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm"); // Form ID'sini güncelledim
    if (!form) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!submitBtn) return;

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm_password").value;
        const messageBox = document.getElementById("message");
        messageBox.textContent = "";

        if (!username || !password || !confirmPassword) {
            messageBox.textContent = "Lütfen tüm alanları doldurun.";
            return;
        }
        if (password.length < 6) {
            messageBox.textContent = "Şifre en az 6 karakter olmalıdır.";
            return;
        }
        if (password !== confirmPassword) {
            messageBox.textContent = "Şifreler uyuşmuyor.";
            return;
        }

        submitBtn.disabled = true;
        const origText = submitBtn.textContent;
        submitBtn.textContent = "Kayıt olunuyor...";

        try {
            const res = await fetch(SUPABASE_API_URL + '/signup', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await res.json();
            if (!res.ok) {
                messageBox.textContent = `Kayıt başarısız: ${data.error || "Bilinmeyen Hata"}`;
                return;
            }

            messageBox.textContent = "Kayıt başarılı! Yönlendiriliyorsunuz...";
            setTimeout(() => {
                window.location.href = "/login.html"; // Kullanıcıyı giriş sayfasına yönlendir
            }, 1500);
        } catch (err) {
            console.error(err);
            messageBox.textContent = "Bir hata oluştu. Konsolu kontrol edin.";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
        }
    });
});