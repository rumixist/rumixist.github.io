document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-button"); // logout butonun ID'si

  logoutBtn.addEventListener("click", () => {
    // localStorage'dan kullanıcı ve token sil
    localStorage.removeItem("currentUsername");
    localStorage.removeItem("token");
    localStorage.removeItem("currentUserId");

    // SessionStorage varsa sil
    sessionStorage.clear();

    // Opsiyonel: kullanıcıyı giriş sayfasına yönlendir
    window.location.href = "/login";
  });
});
