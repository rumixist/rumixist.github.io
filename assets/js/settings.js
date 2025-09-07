document.addEventListener("DOMContentLoaded", () => {

  // Password edit butonunu label'e göre bul (daha güvenli)
  const items = Array.from(document.querySelectorAll("#settings-container .settings-item"));
  const passwordItem = items.find(it => {
    const lbl = it.querySelector(".label");
    return lbl && lbl.textContent.trim().toLowerCase().startsWith("password");
  });
  const passwordEditBtn = passwordItem ? passwordItem.querySelector(".edit-btn") : null;

  const modal = document.getElementById("password-modal");
  const closeBtn = document.getElementById("close-password-modal");
  const passwordForm = document.getElementById("password-form");

  // username localStorage'dan geliyor
  const username = localStorage.getItem("currentUsername");

  const usernameElement = document.getElementById("username");
  if (usernameElement && username) {
    usernameElement.textContent = username;
  }

  if (!username) {
    console.warn("No username found in localStorage (currentUsername).");
    window.location.href = "/login"; // Giriş sayfasına yönlendir
    return;
  }

  if (!passwordEditBtn) {
    console.warn("Password edit button not found.");
  } else {
    passwordEditBtn.addEventListener("click", () => {
      modal.style.display = "flex";
    });
  }

  // Kapatma
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!username) {
      alert("User not logged in.");
      return;
    }

    const oldPassword = document.getElementById("old-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!oldPassword || !newPassword || !confirmPassword) {
      alert("Fill all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    // Disable submit while working
    const submitBtn = passwordForm.querySelector(".save-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    try {
      // Replace <your-project> with your supabase project id (or use env/config)
      const resp = await fetch("https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, oldPassword, newPassword })
      });

      const result = await resp.json().catch(() => ({}));

      if (resp.status === 200) {
        alert(result.message || "Password changed successfully.");
        modal.style.display = "none";
        passwordForm.reset();
      } else if (resp.status === 401) {
        alert(result.error || "Old password is incorrect.");
      } else if (resp.status === 404) {
        alert(result.error || "User not found.");
      } else {
        alert(result.error || "Error:" + resp.status);
      }
    } catch (err) {
      console.error("Change password error:", err);
      alert("An error occurred. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save";
    }
  });
});
