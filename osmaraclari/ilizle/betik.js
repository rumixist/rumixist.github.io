const sehirler = [
  { ad: "İstanbul", relation: 223474 },
  { ad: "Kocaeli", relation: 223499 },
  { ad: "Sakarya", relation: 223555 },
  { ad: "Eskişehir", relation: 223401 },
  { ad: "Çanakkale", relation: 223453 }
];

const kartlarDiv = document.getElementById("kartlar");

sehirler.forEach(sehir => {
  const kart = document.createElement("div");
  kart.className = "kart";
  kart.id = `kart-${sehir.relation}`;

  kart.innerHTML = `
    <h2>${sehir.ad}</h2>
    <div class="bilgi">Bina sayısı: <span>-</span></div>
    <div class="bilgi">Adresli bina: <span>-</span></div>
    <div class="bilgi">Adres oranı: <span>-</span></div>
    <div class="bilgi">Yol sayısı: <span>-</span></div>
    <div class="bilgi">İsimli yol: <span>-</span></div>
    <button>Veriyi al</button>
  `;

  const button = kart.querySelector("button");
  button.addEventListener("click", () => veriGetir(sehir, kart, button));

  kartlarDiv.appendChild(kart);
});

async function veriGetir(sehir, kart, button) {
  button.disabled = true;
  button.textContent = "Yükleniyor...";

  const sorgu = `
  [out:json][timeout:60];
  relation(${sehir.relation})->.alan;
  (
    way["building"](area.alan);
  );
  out count;
  `;

  try {
    const binaSayisi = await overpassSay(sorgu);

    const adresSorgu = `
    [out:json][timeout:60];
    relation(${sehir.relation})->.alan;
    (
      way["building"]["addr:housenumber"](area.alan);
    );
    out count;
    `;

    const adresliBina = await overpassSay(adresSorgu);

    const yolSorgu = `
    [out:json][timeout:60];
    relation(${sehir.relation})->.alan;
    (
      way["highway"](area.alan);
    );
    out count;
    `;

    const yolSayisi = await overpassSay(yolSorgu);

    const isimliYolSorgu = `
    [out:json][timeout:60];
    relation(${sehir.relation})->.alan;
    (
      way["highway"]["name"](area.alan);
    );
    out count;
    `;

    const isimliYol = await overpassSay(isimliYolSorgu);

    const yuzde = binaSayisi > 0
      ? ((adresliBina / binaSayisi) * 100).toFixed(1)
      : "0";

    const bilgiler = kart.querySelectorAll(".bilgi span");
    bilgiler[0].textContent = binaSayisi;
    bilgiler[1].textContent = adresliBina;
    bilgiler[2].textContent = `% ${yuzde}`;
    bilgiler[3].textContent = yolSayisi;
    bilgiler[4].textContent = isimliYol;

    button.textContent = "Veriyi güncelle";
    button.disabled = false;

  } catch (e) {
    alert("Veri alınamadı");
    button.textContent = "Veriyi al";
    button.disabled = false;
  }
}

async function overpassSay(sorgu) {
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: sorgu
  });

  const json = await response.json();
  return json.elements[0].tags.total;
}
