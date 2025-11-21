// Kısa ve yalın: butona tıklandığında ilgili bölümü açar, aktif sınıfı ekler:
document.addEventListener("DOMContentLoaded", function(){
  const btns = document.querySelectorAll(".topic-btn");
  const sections = document.querySelectorAll(".topic-section");

  function closeAll(){
    sections.forEach(s => { s.classList.remove("show"); s.style.display = "none"; });
    btns.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed","false"); });
  }

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const target = document.getElementById(targetId);
      if (!target) return;
      const already = btn.classList.contains("active");
      closeAll();
      if (!already){
        btn.classList.add("active");
        btn.setAttribute("aria-pressed","true");
        target.style.display = "block";
        // küçük gecikmeyle sınıf ekleyerek geçişi tetikle
        requestAnimationFrame(() => target.classList.add("show"));
      }
    });
  });

  // sayfa yüklendiğinde ilk düğmeyi isteğe bağlı açmak için:
  // if(btns[0]) btns[0].click();
});

document.addEventListener("DOMContentLoaded", function(){

  /* === FIELD TABS (Math – Physics – etc.) === */
  const fieldBtns = document.querySelectorAll(".research-field-btn");
  const fieldSections = document.querySelectorAll(".research-field-section");

  function closeAllFields(){
    fieldSections.forEach(s => { s.classList.remove("show"); s.style.display="none"; });
    fieldBtns.forEach(b => b.classList.remove("active"));
  }

  fieldBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.target;
      const target = document.getElementById(id);
      const already = btn.classList.contains("active");

      closeAllFields();

      if(!already){
        btn.classList.add("active");
        target.style.display = "block";
        requestAnimationFrame(()=> target.classList.add("show"));
      }
    });
  });


  /* === LEVEL BUTTONS (HS – UNI – ADV) === */
  const levelGroups = document.querySelectorAll(".level-buttons");

  levelGroups.forEach(group => {
    const levelBtns = group.querySelectorAll(".level-btn");

    levelBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const levelId = btn.dataset.level;
        const levelSection = document.getElementById(levelId);

        /* kapat */
        levelBtns.forEach(b => b.classList.remove("active"));
        const allLevelSections = group.parentNode.querySelectorAll(".level-section");
        allLevelSections.forEach(sec => { sec.classList.remove("show"); sec.style.display="none"; });

        /* aç */
        btn.classList.add("active");
        levelSection.style.display="block";
        requestAnimationFrame(()=> levelSection.classList.add("show"));
      });
    });
  });
});
