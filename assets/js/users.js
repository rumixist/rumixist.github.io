const BASE_URL = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

document.addEventListener("DOMContentLoaded", () => {
    // Önce URL'den kullanıcı ID'sini al
    const pathSegments = window.location.pathname.split('/');
    const userId = pathSegments[pathSegments.length - 1];

    if (userId && !isNaN(userId)) { // userId'nin bir sayı olduğundan emin ol
        fetchUserProfile(userId);
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
        // Diğer bilgileri de ekleyebilirsiniz
        
    } catch (err) {
        console.error(err);
        document.getElementById('profile-username').textContent = 'Kullanıcı bulunamadı veya bir hata oluştu.';
    }
}