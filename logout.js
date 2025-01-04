document.addEventListener('DOMContentLoaded', function () {
    const logoutButton = document.getElementById('logoutButton');

    // Logout butonuna tıklanırsa
    logoutButton.addEventListener('click', function () {
        // localStorage'dan giriş bilgilerini sil
        localStorage.removeItem('loggedIn'); // Giriş durumu bilgisini kaldır
        localStorage.removeItem('userToken'); 

        // Kullanıcıyı login sayfasına yönlendir
        window.location.href = 'login.html';
    });
});
