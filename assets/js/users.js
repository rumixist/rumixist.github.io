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

        // ⭐ Yeni eklenen kısım: Son aktiflik durumunu hesaplama ve gösterme
        if (userData.last_online) {
            document.getElementById("last-online").textContent = formatTimeAgo(userData.last_online);
        } else {
            document.getElementById("last-online").textContent = "Bilinmiyor";
        }

    } catch (err) {
        console.error("fetchUserProfile hatası:", err);
        document.getElementById("profile-username").textContent =
            "Kullanıcı bulunamadı veya bir hata oluştu.";
    }
}

// ⭐ Yeni eklenen fonksiyon: Tarihi kullanıcı dostu bir formata çevirir
function formatTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (diffInSeconds < 60) {
        return "Now Online";
    } else if (minutes < 60) {
        return `${minutes} minutes ago`;
    } else if (hours < 24) {
        return `${hours} hours ago`;
    } else if (days < 30) {
        return `${days} days ago`;
    } else {
        const formattedDate = past.toLocaleDateString("tr-TR", { year: 'numeric', month: 'long', day: 'numeric' });
        return `En son: ${formattedDate}`;
    }
}