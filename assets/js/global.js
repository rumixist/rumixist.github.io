// Gerçek imleci gizle
document.body.style.cursor = "none";

// Özel imleç görselini oluştur
const customCursor = document.createElement("img");
customCursor.src = "/assets/img/cursor.png";
customCursor.alt = "Custom Cursor";
customCursor.id = "custom-cursor";

// Stil ver: boyut, pozisyon, kalite, tıklanamaz
customCursor.style.position = "fixed";
customCursor.style.pointerEvents = "none";
customCursor.style.zIndex = "9999";
customCursor.style.width = "20x";   // PNG boyutuna göre ayarla
customCursor.style.height = "20px";
customCursor.style.transform = ""; // Ortala
customCursor.style.userSelect = "none";
customCursor.style.imageRendering = "auto"; // Kalite için

document.body.appendChild(customCursor);

// Mouse hareketini dinle ve imleci takip ettir
document.addEventListener("mousemove", function(e) {
    customCursor.style.left = e.clientX + "px";
    customCursor.style.top = e.clientY + "px";
});

// Dokunmatik cihazlar için gizle
if ('ontouchstart' in window) {
    customCursor.style.display = "none";
}