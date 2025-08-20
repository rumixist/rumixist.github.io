// assets/js/home.js
const BASE = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

document.addEventListener("DOMContentLoaded", async () => {
    const greeting = document.getElementById("greetingtext");
    const navLoginBtnLi = document.querySelector("li.login-button"); // Updated to use class
    const navUl = document.querySelector("nav ul");

    const token = localStorage.getItem("token");
    if (navLoginBtnLi) navLoginBtnLi.style.display = "none"; // Hide login button by default
    if (!token) {
        if (navLoginBtnLi) navLoginBtnLi.style.display = "block";
        if (greeting) greeting.style.display = "none";
        return;
    }

    try {
        const res = await fetch(`${BASE}/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            localStorage.removeItem("token");
            if (navLoginBtnLi) navLoginBtnLi.style.display = "block";
            if (greeting) greeting.style.display = "none";
            handleRedirects(); // Redirects if token is invalid
            return;
        }

        const userData = await res.json();
        const username = userData?.username;

        if (username) {
            if (greeting) {
                greeting.textContent = `Hoşgeldiniz, ${username}!`;
                greeting.style.display = "block";
            }
            if (navLoginBtnLi) navLoginBtnLi.style.display = "none";
            
        }

    } catch (err) {
        console.error("Error fetching /me:", err);
        localStorage.removeItem("token");
        if (navLoginBtnLi) navLoginBtnLi.style.display = "block";
        if (greeting) greeting.style.display = "none";
        handleRedirects();
    }
});