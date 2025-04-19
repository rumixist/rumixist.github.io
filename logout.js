document.addEventListener('DOMContentLoaded', function () {
    const logoutButton = document.getElementById('logoutButton');

    logoutButton.addEventListener('click', function () {
        // Sadece çıkış yapıldığında token'ı sil
        localStorage.removeItem("token");
        window.location.href = "login.html"; // Kullanıcıyı login sayfasına yönlendir
    });
});
