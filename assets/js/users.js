const BASE_URL = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

document.addEventListener("DOMContentLoaded", () => {
    // URL'deki sorgu parametrelerini al
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    console.log("Alınan Kullanıcı ID'si:", userId);

    if (userId) {
        fetchUserProfile(userId);
    } else {
        document.getElementById('profile-username').textContent = 'Kullanıcı ID\'si gerekli.';
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
        if (userData.bio) {
             document.getElementById('profile-bio').textContent = userData.bio;
        }

    } catch (err) {
        console.error(err);
        document.getElementById('profile-username').textContent = 'Kullanıcı bulunamadı veya bir hata oluştu.';
    }
}