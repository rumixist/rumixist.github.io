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
customCursor.style.width = "20x";   // PNG boyutuna göre ayarla
customCursor.style.height = "20px";
customCursor.style.transform = ""; // Ortala
customCursor.style.userSelect = "none";
customCursor.style.imageRendering = "auto"; // Kalite için

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
    // href="/users/" niteliğine sahip olan <a> etiketini seçeriz.
    const profileLink = document.querySelector('a[href="/users/"]');
    
    // localStorage'dan daha önce kaydettiğimiz kullanıcı ID'sini alırız.
    const userId = localStorage.getItem("currentUserId");

    // Eğer hem profil linki hem de kullanıcı ID'si varsa...
    if (profileLink && userId) {
        // ...linkin href özelliğini, kullanıcının ID'si ile güncelleriz.
        profileLink.href = `/users/?id=${userId}`;
        console.log("Profil linki başarıyla güncellendi:", profileLink.href);
    } else {
        // Eğer kullanıcı ID'si yoksa (örneğin giriş yapılmamışsa)
        // link varsayılan değerinde kalır, bu sayede hata oluşmaz.
        console.log("Kullanıcı ID'si bulunamadı veya profil linki yok.");
    }
});

// Her 60 saniyede bir kullanıcının last_online verisini güncelleyen fonksiyon
async function updateLastOnline() {
    const token = localStorage.getItem("token");

    // Sadece token varsa API çağrısı yap
    if (!token) {
        console.log("Token bulunamadı, last_online güncellemesi atlanıyor.");
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
            // Başarılı olursa logla (opsiyonel)
            console.log("Last online başarıyla güncellendi.");
        } else {
            // Hata durumunda token'ı silme (daha önce login/me fonksiyonlarında halledildi)
            // Sadece loglama yapıyoruz, hata durumunu anlamak için.
            console.error(`Last online güncelleme hatası: ${res.status} ${res.statusText}`);
        }
    } catch (err) {
        // Ağ hatası gibi durumlarda loglama yap
        console.error("Last online güncelleme isteği başarısız oldu:", err);
    }
}

// Sayfa yüklendiğinde, last_online güncelleme işlemini başlat
document.addEventListener("DOMContentLoaded", () => {
    // 60 saniyelik aralıklarla fonksiyonu çağır
    // 60000ms = 60 saniye
    setInterval(updateLastOnline, 300000);
});

document.addEventListener("DOMContentLoaded", async () => {
    const greeting = document.getElementById("greetingtext");
    const navLoginBtnLi = document.querySelector("li.login-button");
    const navUl = document.querySelector("nav ul");

    const token = localStorage.getItem("token");
    const localUsername = localStorage.getItem("currentUsername");

    // Varsayılan olarak login düğmesini gizle
    if (navLoginBtnLi) navLoginBtnLi.style.display = "none";
    
    // Hızlı bir şekilde localStorage'daki ismi göster
    if (localUsername && greeting) {
        greeting.textContent = getGreetingMessage(localUsername);
        greeting.style.display = "block";
    }

    // Token yoksa login düğmesini göster ve işlemi bitir
    if (!token) {
        if (navLoginBtnLi) navLoginBtnLi.style.display = "block";
        if (greeting) greeting.style.display = "none";
        return;
    }

    // API çağrısı ile token'ı doğrula ve verileri al
    try {
        const res = await fetch(`${BASE_URL_G}/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        // 401 Unauthorized ise token'ı temizle ve çıkış yap
        if (res.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("currentUsername");
            localStorage.removeItem("currentUserId");
            if (navLoginBtnLi) navLoginBtnLi.style.display = "block";
            if (greeting) greeting.style.display = "none";
            // İhtiyaç varsa yönlendirme fonksiyonunu çağırabilirsiniz
            return;
        }

        // Başarısız diğer durumlarda token'ı kaldırmadan logla
        if (!res.ok) {
            console.error(`API hatası: ${res.status} ${res.statusText}`);
            if (navLoginBtnLi) navLoginBtnLi.style.display = "block";
            if (greeting) greeting.style.display = "none";
            return;
        }

        const userData = await res.json();
        const apiUsername = userData?.username;
        const apiUserId = userData?.id;

        if (apiUsername) {
            // API'den gelen veriyi localStorage'daki ile doğrula ve güncelle
            if (localUsername !== apiUsername) {
                localStorage.setItem("currentUsername", apiUsername);
            }
            if (localStorage.getItem("currentUserId") !== apiUserId) {
                 localStorage.setItem("currentUserId", apiUserId);
            }

            // Karşılama mesajını API verisiyle güncelle
            if (greeting) {
                greeting.textContent = getGreetingMessage(apiUsername);
                greeting.style.display = "block";
            }
            if (navLoginBtnLi) navLoginBtnLi.style.display = "none";
        }
    } catch (err) {
        console.error("Error fetching /me:", err);
        // Ağ hatası durumunda yönlendirme yapabiliriz, token'ı kaldırmayız
    }

    // Her 60 saniyede bir last_online'ı güncelleyecek aralık başlat
    // NOT: En iyi çözüm, last_online için ayrı bir hafif fonksiyon yazmaktır.
    // Bu kod şimdilik /me'yi kullanmaya devam eder.
    setInterval(async () => {
        const tokenForUpdate = localStorage.getItem("token");
        if (tokenForUpdate) {
            try {
                // Burada /me yerine /update-last-online fonksiyonunu çağırın.
                await fetch(`${BASE_URL_G}/me`, { 
                    method: "GET", 
                    headers: { "Authorization": `Bearer ${tokenForUpdate}` } 
                });
            } catch (e) {
                console.error("Last online güncelleme hatası:", e);
            }
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

        if (data.results.length === 0) {
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