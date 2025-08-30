const SUPABASE_API_URL = "https://jneuwkadlgoxekhcbvdh.supabase.co/functions/v1";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("supportForm");
    if (!form) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!submitBtn) return;

        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value;
        const confirmEmail = document.getElementById("confirm-email").value;
        var category = document.getElementById("help-category").value.trim();
        const description = document.getElementById("describe").value.trim();
        const messageBox = document.getElementById("message");
        messageBox.textContent = "";

        if (!email || !confirmEmail || !category || !description) {
            messageBox.textContent = "Fill all required fields.";
            return;
        }
        if (email !== confirmEmail) {
            messageBox.textContent = "Emails do not match.";
            return;
        }
        if (category == "hc0") {
            messageBox.textContent = "Please select a valid category.";
            return;
        } else if (category == "hc1") {
            category = "Account Hacked or Can't Login";
        } else if (category == "hc2") {
            category = "Falsely Banned";
        } else if (category == "hc3") {
            category = "I Want To Delete My Account";
        } else if (category == "hc4") {
            category = "Bug Report";
        } else if (category == "hc5") {
            category = "Report a User";
        } else if (category == "hc6") {
            category = "Suggestions & Ideas";
        } else if (category == "hc7") {
            category = "I Want to Know Something";
        } else if (category == "hc8") {
            category = "How to";
        } else if (category == "hc9") {
            category = "Other";
        }

        submitBtn.disabled = true;
        const origText = submitBtn.textContent;
        submitBtn.textContent = "Submitting...";

        try {
            const res = await fetch(SUPABASE_API_URL + '/support', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    category: category,
                    description: description
                })
            });

            const data = await res.json();
            if (!res.ok) {
                messageBox.textContent = `Process unsuccesfull: ${data.error || "Unknown error"}`;
                return;
            }

            messageBox.textContent = "Process succesfull!";

        } catch (err) {
            console.error(err);
            messageBox.textContent = "An error occurred while submitting the form.";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
        }
    });
});