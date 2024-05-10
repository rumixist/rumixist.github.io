document.addEventListener("DOMContentLoaded", function() {
    const generateButton = document.getElementById("generateButton");
    const outputText = document.getElementById("outputText");

    generateButton.addEventListener("click", function() {
        fetch("https://rumixist.pythonanywhere.com") // HTTPS kullanarak istek gönder
            .then(response => response.json())
            .then(data => {
                outputText.value = data.sentence;
            })
            .catch(error => console.error("Hata:", error));
    });
});
