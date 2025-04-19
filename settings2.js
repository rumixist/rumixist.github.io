document.addEventListener('DOMContentLoaded', function () {
    const clearTokensButton = document.getElementById('clearTokensButton');
    const passwordModal = document.getElementById('passwordModal');
    const passwordForm = document.getElementById('passwordForm');
    const passwordInput = document.getElementById('password');
    const deleteCurrentTokenCheckbox = document.getElementById('deleteCurrentToken');
    const cancelModal = document.getElementById('cancelModal');

    clearTokensButton.addEventListener('click', function () {
        // Modal'ı aç
        passwordModal.style.display = 'flex';
    });

    cancelModal.addEventListener('click', function () {
        // Modal'ı kapat
        passwordModal.style.display = 'none';
    });

    passwordForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const password = passwordInput.value;
        const token = localStorage.getItem('token');

        if (!password) {
            alert('Lütfen şifrenizi girin.');
            return;
        }

        try {
            // Şifre doğrulaması yap (örnek olarak API'ye istek gönderiyoruz)
            const response = await fetch('https://rumixist.pythonanywhere.com/verify_password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ password })
            });

            const result = await response.json();

            if (response.ok) {
                // Şifre doğrulandı, token silme işlemini başlat
                const clearResponse = await fetch('https://rumixist.pythonanywhere.com/clear_tokens', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        delete_current_token: deleteCurrentTokenCheckbox.checked
                    })
                });

                const clearResult = await clearResponse.json();

                if (clearResponse.ok) {
                    localStorage.removeItem('token'); // Eğer geçerli token da silindiyse
                    window.location.href = 'login.html'; // Kullanıcıyı giriş sayfasına yönlendir
                } else {
                    alert(clearResult.error || 'Error');
                }

                // Modal'ı kapat
                passwordModal.style.display = 'none';

            } else {
                alert(result.error || 'Password is not correct');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Unexpected Error: 73S2');
        }
    });
});
