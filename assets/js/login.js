// assets/js/login.js
const BASE = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    if (!form) return;
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!submitBtn) return;

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        // Kullanıcı adı ve şifre boşsa uyar
        const messageBox = document.getElementById("message");
        if (messageBox) messageBox.textContent = "";

        if (!username || !password) {
            if (messageBox) {
                messageBox.textContent = "Lütfen tüm alanları doldurun.";
            } else {
                alert("Lütfen tüm alanları doldurun.");
            }
            return;
        }

        submitBtn.disabled = true;
        const orig = submitBtn.textContent;
        submitBtn.textContent = "Logging in...";

        try {
            const res = await fetch(`${BASE}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            // JSON yanıtını güvenli bir şekilde işle
            const payload = await res.json().catch(() => ({ error: "API yanıtı geçerli bir JSON değil." }));

            if (!res.ok) {
                const errorMessage = payload?.error || "Bilinmeyen Hata";
                if (messageBox) {
                    messageBox.textContent = `Giriş başarısız: ${errorMessage}`;
                } else {
                    alert(`Giriş başarısız: ${errorMessage}`);
                }
                return;
            }

            // ⭐ Düzeltilen kısım
            if (payload?.token) {
                localStorage.setItem("token", payload.token);
                
                // Backend'in döndürdüğü 'userId' anahtarını kullanıyoruz.
                if (payload?.userId) {
                    localStorage.setItem("currentUserId", payload.userId);
                }
                if (payload?.username) {
                    localStorage.setItem("currentUsername", payload.username);
                }
            }

            const successMessage = "Login succesfull, please wait...";
            if (messageBox) {
                messageBox.textContent = successMessage;
            } else {
                alert(successMessage);
            }

            setTimeout(() => {
                window.location.href = "/"; // veya ana sayfanızın adresi
            }, 1500);

        } catch (err) {
            console.error(err);
            const errorMessage = "Error occurred while logging in. Check the console for details.";
            if (messageBox) {
                messageBox.textContent = errorMessage;
            } else {
                alert(errorMessage);
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = orig;
        }
    });
});