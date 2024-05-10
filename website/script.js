document.addEventListener("mousemove", (e) => {
    const customCursor = document.querySelector(".custom-cursor");
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    customCursor.style.left = e.clientX + "px";
    customCursor.style.top = e.clientY + scrollTop + "px";
});
