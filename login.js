document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const username = form.querySelector('input[name="username"]').value;
        const password = form.querySelector('input[name="password"]').value;

        try {
            const response = await fetch('https://rumixist.pythonanywhere.com/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                // Login başarılıysa, bir "token" veya oturum verisi varsa burada işlenebilir
                localStorage.setItem('token', result.token);

                // Yönlendirmeden önce 1 saniye bekle
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1000); // 1000 milisaniye = 1 saniye

            } else {
                // Login başarısızsa sunucudan gelen hata mesajını göster
                alert(result.error || 'Login failed');
            }
        } catch (error) {
            // Fetch isteği sırasında bir hata oluşursa
            console.error('Login error:', error);
            alert('An unexpected error occurred. Please try again later.');
        }
    });
});