document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('token'); // Token'ı al

    if (!token) {
        window.location.href = 'login.html'; // Eğer token yoksa login sayfasına yönlendir
        return;
    }

    try {
        const response = await fetch('https://rumixist.pythonanywhere.com/verify', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const result = await response.json();

        if (response.ok) {
            // Kullanıcı bilgilerini aldıktan sonra sayfada göster
            const usernameDisplay = document.getElementById('username-display');
            const idDisplay = document.getElementById('id-display'); // ID'yi gösterecek yer

            usernameDisplay.textContent = result.user; // Kullanıcı adını buraya yerleştiriyoruz
            idDisplay.textContent = result.id; // Kullanıcı ID'sini buraya yerleştiriyoruz
        } else {
            console.error("Error fetching user data: ", result);
            alert("Unable to fetch user data.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while fetching user data.");
    }
});
