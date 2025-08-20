const BASE_URL = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    let userId = urlParams.get("id");

    console.log("Alınan Kullanıcı ID'si:", userId);

    // Eğer id "me" ise localStorage'dan kendi id'sini al
    if (userId === "me") {
        userId = localStorage.getItem("currentUserId");
        console.log("Sidebar üzerinden kendi profilimiz açılıyor, userId:", userId);
    }

    if (userId) {
        fetchUserProfile(userId);
    } else {
        document.getElementById("profile-username").textContent = "Kullanıcı ID'si gerekli.";
    }
});

async function fetchUserProfile(userId) {
    try {
        const res = await fetch(`${BASE_URL}/profile?userId=${userId}`);

        console.log("HTTP status kodu:", res.status);

        if (!res.ok) {
            let errorText = "Kullanıcı bilgileri alınamadı.";
            try {
                const errorData = await res.json();
                if (errorData.error) errorText = errorData.error;
                console.log("Hata yanıtı:", errorData);
            } catch (e) {
                console.log("Hata yanıtı JSON parse edilemedi.");
            }
            throw new Error(errorText);
        }

        const userData = await res.json();
        console.log("Alınan userData:", userData);
        console.log("admin_role tipi ve değeri:", typeof userData.admin_role, userData.admin_role);

        // Kullanıcı adı
        document.getElementById("profile-username").textContent = userData.username || "—";

        // Rozetler (admin kontrolü: 0/1 veya "0"/"1")
        const badgeContainer = document.getElementById("profile-badges");
        badgeContainer.innerHTML = ""; // önce temizle
        const isAdmin = userData.admin_role === 1 || userData.admin_role === "1";
        console.log("isAdmin boolean:", isAdmin);

        if (isAdmin) {
            const badge = document.createElement("span");
            badge.className = "badge admin";
            badge.textContent = "Admin";
            badgeContainer.appendChild(badge);
        }

        // Hesap oluşturulma tarihi
        if (userData.created_at) {
            const date = new Date(userData.created_at);
            const formatted = date.toLocaleDateString("tr-TR", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            document.getElementById("profile-created").textContent = formatted;
        } else {
            document.getElementById("profile-created").textContent = "—";
        }

    } catch (err) {
        console.error("fetchUserProfile hatası:", err);
        document.getElementById("profile-username").textContent =
            "Kullanıcı bulunamadı veya bir hata oluştu.";
    }
}
