document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Formdan alınan veriler
        const day = form.querySelector('select[name="day"]').value;
        const month = form.querySelector('select[name="month"]').value;
        const year = form.querySelector('select[name="year"]').value;
        const username = form.querySelector('input[name="username"]').value.trim();
        const password = form.querySelector('input[name="password"]').value;
        const confirmPassword = form.querySelector('input[name="confirm_password"]').value;

        // Doğum tarihi zorunlu mu kontrolü (sadece boş geçilmesin diye)
        if (!day || !month || !year) {
            alert("Please select your date of birth.");
            return;
        }

        if (!username || !password) {
            alert("Username and password are required.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch("https://rumixist.pythonanywhere.com/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const result = await response.json();

            if (response.ok) {
                alert("You have successfully signed up!");
                window.location.href = "home.html";
            } else {
                alert(result.error || "Sign-up failed.");
            }

        } catch (error) {
            console.error("Signup error:", error);
            alert("An error occurred. Please try again.");
        }
    });
});
