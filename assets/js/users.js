const BASE_URL = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

document.addEventListener("DOMContentLoaded", () => {
    // localStorage'dan yönlendirilen kullanıcı ID'sini al
    const userId = localStorage.getItem('redirect_to_user_id');
    localStorage.removeItem('redirect_to_user_id'); // ID'yi kullandıktan sonra temizle

    // Eğer ID yoksa, URL'den almayı dene (yerel testler için veya direkt erişim için)
    const pathSegments = window.location.pathname.split('/');
    const urlId = pathSegments[pathSegments.length - 1];

    const finalUserId = userId || urlId;

    console.log("Alınan Kullanıcı ID'si:", finalUserId);

    if (finalUserId && !isNaN(finalUserId)) {
        fetchUserProfile(finalUserId);
    } else {
        document.getElementById('profile-username').textContent = 'Geçersiz kullanıcı ID\'si.';
    }
});

async function fetchUserProfile(userId) {
    try {
        const res = await fetch(`${BASE_URL}/profile?userId=${userId}`);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Kullanıcı bilgileri alınamadı.');
        }

        const userData = await res.json();
        
        document.getElementById('profile-username').textContent = userData.username;
        document.getElementById('profile-email').textContent = userData.email;
        // Diğer verileri de ekleyebilirsiniz (örn. bio)
        if (userData.bio) {
             document.getElementById('profile-bio').textContent = userData.bio;
        }

    } catch (err) {
        console.error(err);
        document.getElementById('profile-username').textContent = 'Kullanıcı bulunamadı veya bir hata oluştu.';
    }
}