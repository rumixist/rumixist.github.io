document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch('https://rumixist.pythonanywhere.com/verify', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!res.ok) {
            throw new Error('Geçersiz token');
        }

        const data = await res.json();
        console.log("Doğrulandı:", data);
        // Token geçerli, devam edebilir

    } catch (err) {
        console.warn("JWT doğrulaması başarısız:", err.message);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
});
