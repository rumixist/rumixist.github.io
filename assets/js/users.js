const BASE_URL = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

document.addEventListener("DOMContentLoaded", () => {
    const profileHeader = document.querySelector(".profile-header");
    const profileMeta = document.querySelector(".profile-meta");

    // Başlangıçta gizle (CSS'de de gizli, burası ekstra garantidir)
    if (profileHeader) profileHeader.style.display = "none";
    if (profileMeta) profileMeta.style.display = "none";

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
        // Kullanıcı ID yoksa hata mesajını göster ve header/meta'yı görünür yap
        const usernameEl = document.getElementById("profile-username");
        if (usernameEl) usernameEl.textContent = "Login to view your profile.";
        if (profileHeader) profileHeader.style.display = "flex";
        if (profileMeta) profileMeta.style.display = "flex";
    }
});

async function fetchUserProfile(userId) {
    const profileHeader = document.querySelector(".profile-header");
    const profileMeta = document.querySelector(".profile-meta");

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

        // Burada veriler başarıyla geldiği için header/meta'yı göster
        if (profileHeader) profileHeader.style.display = "flex";
        if (profileMeta) profileMeta.style.display = "flex";

        // Kullanıcı adı
        const profileUsernameEl = document.getElementById("profile-username");
        if (profileUsernameEl) profileUsernameEl.textContent = userData.username || "—";

        // Rozetler (admin kontrolü: 0/1 veya "0"/"1")
        const badgeContainer = document.getElementById("profile-badges");
        if (badgeContainer) {
            badgeContainer.innerHTML = ""; // önce temizle
            const isAdmin = userData.admin_role === 1 || userData.admin_role === "1";
            console.log("isAdmin boolean:", isAdmin);

            if (isAdmin) {
                const badge = document.createElement("span");
                badge.className = "badge admin";
                badge.textContent = "Admin";
                badgeContainer.appendChild(badge);
            }
        }

        // Hesap oluşturulma tarihi
        const createdEl = document.getElementById("profile-created");
        if (createdEl) {
            if (userData.created_at) {
                const date = new Date(userData.created_at);
                const formatted = date.toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
                createdEl.textContent = formatted;
            } else {
                createdEl.textContent = "—";
            }
        }

        // ⭐ Yeni eklenen kısım: Son aktiflik durumunu hesaplama ve gösterme
        const lastOnlineEl = document.getElementById("last-online");
        if (lastOnlineEl) {
            if (userData.last_online) {
                lastOnlineEl.textContent = formatTimeAgo(userData.last_online);
            } else {
                lastOnlineEl.textContent = "Bilinmiyor";
            }
        }

    } catch (err) {
        console.error("fetchUserProfile hatası:", err);
        // Hata durumunda kullanıcıya mesaj göster, ve header/meta'yı aç
        const profileUsernameEl = document.getElementById("profile-username");
        if (profileUsernameEl) profileUsernameEl.textContent =
            "User not found or an error occurred.";
        if (profileHeader) profileHeader.style.display = "flex";
        if (profileMeta) profileMeta.style.display = "flex";
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
        return `${formattedDate}`;
    }
}
