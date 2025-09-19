// Gerçek imleci gizle
document.body.style.cursor = "none";

const BASE_URL_G = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

// Özel imleç görselini oluştur
const customCursor = document.createElement("img");
customCursor.src = "/assets/img/cursor.png";
customCursor.alt = "Custom Cursor";
customCursor.id = "custom-cursor";

// Stil ver: boyut, pozisyon, kalite, tıklanamaz
customCursor.style.position = "fixed";
customCursor.style.pointerEvents = "none";
customCursor.style.zIndex = "9999";
customCursor.style.width = "20px";
customCursor.style.height = "20px";
customCursor.style.transform = ""; // Ortala (isteğe bağlı)
customCursor.style.userSelect = "none";
customCursor.style.imageRendering = "auto";

document.body.appendChild(customCursor);

// Mouse hareketini dinle ve imleci takip ettir
document.addEventListener("mousemove", function(e) {
    customCursor.style.left = e.clientX + "px";
    customCursor.style.top = e.clientY + "px";
});

// Dokunmatik cihazlar için gizle
if ('ontouchstart' in window) {
    customCursor.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
    const profileLink = document.querySelector('a[href="/users/"]');
    const userId = localStorage.getItem("currentUserId");

    if (profileLink && userId) {
        profileLink.href = `/users/?id=${userId}`;
        console.log("Profil linki başarıyla güncellendi:", profileLink.href);
    } else {
        console.log("Kullanıcı ID'si bulunamadı veya profil linki yok.");
    }

    const friendsLink = document.querySelector('a[href="/users/friends/"]');

    if (friendsLink && userId) {
        friendsLink.href = `/users/friends/?id=${userId}`;
        console.log("Friends link succesfully updated:", profileLink.href);
    } else {
        console.log("ID could not be found or friends link does not exist.");
    }
});

/**
 * Token'ı güvenli hale getirip döndüren yardımcı fonksiyon.
 * - Etraftaki tırnakları temizler,
 * - Trim yapar,
 * - ASCII dışı karakterleri atar,
 * - Basit JWT format kontrolü yapar.
 * Geçersiz ise token'ı siler ve null döner.
 */
function getSafeToken() {
    const raw = localStorage.getItem("token");
    if (!raw) return null;

    let token = raw;

    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
        token = token.slice(1, -1);
    }

    token = token.trim();

    const ascii = token.replace(/[^\x20-\x7E]/g, '');
    const hasTwoDots = (ascii.match(/\./g) || []).length >= 2;
    const allowedPattern = /^[A-Za-z0-9\-_\.=]+$/;

    if (!hasTwoDots || !allowedPattern.test(ascii)) {
        console.warn("Token geçersiz görünüyor; temizleniyor:", raw);
        localStorage.removeItem("token");
        return null;
    }

    return ascii;
}

// Her 5 dakikada bir kullanıcının last_online verisini güncelleyen fonksiyon
async function updateLastOnline() {
    const token = getSafeToken();

    if (!token) {
        console.log("Token bulunamadı veya geçersiz, last_online güncellemesi atlanıyor.");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL_G}/update-last-online`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.ok) {
            console.log("Last online başarıyla güncellendi.");
        } else {
            console.error(`Last online güncelleme hatası: ${res.status} ${res.statusText}`);
        }
    } catch (err) {
        console.error("Last online güncelleme isteği başarısız oldu:", err);
    }
}

// Sayfa yüklendiğinde, last_online güncelleme işlemini başlat
document.addEventListener("DOMContentLoaded", () => {
    setInterval(updateLastOnline, 300000); // 5 dakika
});

document.addEventListener("DOMContentLoaded", async () => {
    const greeting = document.getElementById("greetingtext");
    const navLoginBtnLi = document.querySelector("li.login-button");
    const navUl = document.querySelector("nav ul");

    const localUsername = localStorage.getItem("currentUsername");

    if (navLoginBtnLi) navLoginBtnLi.style.display = "none";

    if (localUsername && greeting) {
        greeting.textContent = getGreetingMessage(localUsername);
        greeting.style.display = "block";
    }

    const token = getSafeToken();
    if (!token) {
        if (navLoginBtnLi) navLoginBtnLi.style.display = "block";
        if (greeting) greeting.style.display = "none";
        return;
    }

    try {
        const res = await fetch(`${BASE_URL_G}/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("currentUsername");
            localStorage.removeItem("currentUserId");
            if (navLoginBtnLi) navLoginBtnLi.style.display = "block";
            if (greeting) greeting.style.display = "none";
            return;
        }

        if (!res.ok) {
            console.error(`API hatası: ${res.status} ${res.statusText}`);
            if (navLoginBtnLi) navLoginBtnLi.style.display = "block";
            if (greeting) greeting.style.display = "none";
            return;
        }

        const userData = await res.json();
        const apiUsername = userData?.username;
        const apiUserId = userData?.id;

        // --- BAN KONTROLÜ ve ban-window doldurma (yeni HTML yapısına göre) ---
        if (userData?.banned) {
            try {
                const ban = userData.ban || {};
                const banWindow = document.getElementById("ban-window");

                console.log("user banned:", ban);

                // Helper: güvenli tarih formatlama
                const fmt = (d) => {
                    if (!d) return "Süresiz";
                    try {
                        return new Date(d).toLocaleString("tr-TR");
                    } catch (e) {
                        return String(d);
                    }
                };

                if (banWindow) {
                    // Başlık (DB'de ban_title veya ban_type olabilir)
                    const banTitle = ban?.ban_title || ban?.ban_type || ban?.title || "Account Terminated";
                    const titleEl = banWindow.querySelector("#ban-title");
                    if (titleEl) titleEl.textContent = banTitle;


                    // Primary description (opsiyonel alan)
                    const priDescEl = banWindow.querySelector(".pri-ban-desc");
                    if (priDescEl) {
                        priDescEl.textContent = ban?.primary_desc || ban?.pri_desc || "Our moderators have determined that your behaviour at this website has been in violation of our Terms of Use";
                    }

                    // Ban date (start_time veya startTime veya ban_date)
                    const startTime = ban?.start_time || ban?.startTime || ban?.ban_date || ban?.created_at || null;
                    const banDateSpan = banWindow.querySelector(".ban-date span");
                    if (banDateSpan) banDateSpan.textContent = fmt(startTime);

                    // Moderator note
                    const modNoteEl = banWindow.querySelector(".moderator-note");
                    if (modNoteEl) modNoteEl.textContent = `Moderator Note: ${ban?.moderator_note || ban?.moderatorNote || ""}`;

                    // Reason
                    const reasonEl = banWindow.querySelector(".ban-reason");
                    if (reasonEl) reasonEl.textContent = `Reason: ${ban?.reason || ""}`;

                    // Offensive item
                    const offEl = banWindow.querySelector(".offensive-item");
                    if (offEl) offEl.textContent = `Offensive Item: ${ban?.offensive_item || ban?.offensiveItem || ""}`;

                    // Secondary description (optional)
                    const secDescEl = banWindow.querySelector(".sec-ban-desc");
                    if (secDescEl) secDescEl.textContent = ban?.secondary_desc || "Please abide by the community guidelines so that this website can be fun for users of all ages";

                    // Reactivate date (end_time)
                    const endTime = ban?.end_time || ban?.endTime || null;
                    const reactivateSpan = banWindow.querySelector(".reactivate-date span");
                    if (reactivateSpan) reactivateSpan.textContent = fmt(endTime);

                    // Görünür yap
                    banWindow.style.display = "flex";
                    if ( document.URL.includes("users") || document.URL.includes("search") ) {
                        window.location.href = "/";
                    }
                } else {
                    console.warn("Ban bilgisi var ama #ban-window bulunamadı.");
                    //alert("Reminder, your account has been banned.");
                }
            } catch (e) {
                console.error("Ban penceresi gösterilirken hata:", e);
            }

            // Banlıyken token ve local kullanıcı verilerini temizle
            if (greeting) greeting.style.display = "none";

            // Ban penceresindeki logout butonuna event bağla (varsa)
            const logoutBtn = document.getElementById("ban-logout-button");
            if (logoutBtn) {
                logoutBtn.onclick = function() {
                    localStorage.removeItem("token");
                    localStorage.removeItem("currentUsername");
                    localStorage.removeItem("currentUserId");
                    // Yeniden yönlendirme veya sayfa yenileme
                    location.reload();
                };
            }

            return; // Banlı kullanıcı diğer UI işlemlerine devam etmez
        }
        // --- /BAN KONTROLÜ SONU ---

        if (apiUsername) {
            if (localUsername !== apiUsername) {
                localStorage.setItem("currentUsername", apiUsername);
            }
            if (localStorage.getItem("currentUserId") !== apiUserId) {
                 localStorage.setItem("currentUserId", apiUserId);
            }

            if (greeting) {
                greeting.textContent = getGreetingMessage(apiUsername);
                greeting.style.display = "block";
            }
            if (navLoginBtnLi) navLoginBtnLi.style.display = "none";
        }
    } catch (err) {
        console.error("Error fetching /me:", err);
    }

    // Her 60 saniyede bir last_online'ı güncelleyecek aralık başlat
    setInterval(async () => {
        try {
            await updateLastOnline();
        } catch (e) {
            console.error("Last online güncelleme hatası:", e);
        }
    }, 60000);
});

function handleSearch(event) {
    event.preventDefault();
    const query = document.getElementById("searchInput").value.trim();
    if (query) {
        const encoded = encodeURIComponent(query);
        window.location.href = `/search/?q=${encoded}`;
    }
    return false;
}

async function renderSearchResults() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");

    if (!query) return;

    const resultsContainer = document.getElementById("search-results");
    resultsContainer.innerHTML = `<p>Searching for "<b>${query}</b>"...</p>`;

    try {
        const resp = await fetch(`${BASE_URL_G}/search-users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ search: query })
        });
        const data = await resp.json();

        if (data.error) {
            resultsContainer.innerHTML = `<p style="color:red">Error: ${data.error}</p>`;
            return;
        }

        if (!Array.isArray(data.results) || data.results.length === 0) {
            resultsContainer.innerHTML = `<p>No users found for "<b>${query}</b>"</p>`;
        } else {
            resultsContainer.innerHTML = `<p>Results for "<b>${query}</b>":</p>
                <div class="cards-container">
                    ${data.results.map(u => `
                        <a href="/users/?id=${u.id}" class="user-card">
                            <div class="avatar-placeholder"></div>
                            <div class="user-info">
                                <span class="username">${u.username}</span>
                                <span class="userid">(${u.id})</span>
                            </div>
                        </a>
                    `).join("")}
                </div>`;
        }
    } catch (err) {
        resultsContainer.innerHTML = `<p style="color:red">Failed to fetch results</p>`;
    }
}
