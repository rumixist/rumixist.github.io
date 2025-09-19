// assets/js/home.js
const BASE = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

document.addEventListener("DOMContentLoaded", async () => {
    const greeting = document.getElementById("greetingtext");
    const navLoginBtnLi = document.querySelector("li.login-button");
    const navUl = document.querySelector("nav ul");

    const token = localStorage.getItem("token");
    const localUsername = localStorage.getItem("currentUsername");

    if (navLoginBtnLi) navLoginBtnLi.style.display = "none";

    // Token ve kullanıcı adı varsa selamlama metnini göster
    if (token && localUsername) {
        if (greeting) {
            greeting.textContent = getGreetingMessage(localUsername);
            greeting.style.display = "block";

            document.getElementById("home-main-text").textContent = "Welcome to the homepage! ";
            document.getElementById("friends").textContent = "More things to show on home page are coming soon!";
        }
    } else {
        // Token veya kullanıcı adı yoksa giriş düğmesini göster
        if (navLoginBtnLi) navLoginBtnLi.style.display = "block";
        if (greeting) greeting.style.display = "none";

        document.getElementById("home-main-text").textContent = "You can log in to see some other features.";
    }
});

// Günün saatine göre selamlama metni oluşturan fonksiyon
function getGreetingMessage(username) {
    const hour = new Date().getHours();
    let message = "Welcome";

    if (hour >= 5 && hour < 12) {
        message = "Good Morning";
    } else if (hour >= 12 && hour < 17) {
        message = "Good Afternoon";
    } else if (hour >= 17 && hour < 21) {
        message = "Good Evening";
    } else {
        message = "Good Night";
    }

    return `${message}, ${username}!`;
}