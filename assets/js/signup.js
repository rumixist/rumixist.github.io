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
            messageBox.textContent = "Fill all fields.";
            return;
        }
        if (password.length < 6) {
            messageBox.textContent = "Password must be at least 6 characters length.";
            return;
        }
        if (password !== confirmPassword) {
            messageBox.textContent = "Passwords do not match.";
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
                messageBox.textContent = `Signup unsuccesfull: ${data.error || "Bilinmeyen Hata"}`;
                return;
            }

            messageBox.textContent = "Sign up succesfull! Redirecting...";
            setTimeout(() => {
                window.location.href = "/login"; // Kullanıcıyı giriş sayfasına yönlendir
            }, 1500);
        } catch (err) {
            console.error(err);
            messageBox.textContent = "An error occurred while signing up. Check the console for details.";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
        }
    });
});