document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const decoded = jwt_decode(token);
        const username =
            decoded.username ||
            decoded.user ||
            decoded.name ||
            decoded.sub ||
            'kullanıcı';

        const greetingEl = document.getElementById('greeting-message');
        const hour = new Date().getHours();
        let greeting = '';

        if (hour >= 5 && hour < 10) {
            greeting = 'Günaydın';
        } else if (hour >= 10 && hour < 17) {
            greeting = 'İyi günler';
        } else if (hour >= 17 && hour < 22) {
            greeting = 'İyi akşamlar';
        } else {
            greeting = 'İyi geceler';
        }

        greetingEl.textContent = `${greeting}, ${username}`;
    } catch (e) {
        console.error("JWT çözümleme hatası:", e);
    }
});