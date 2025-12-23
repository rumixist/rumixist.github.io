const fs = require("fs");

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const CIKTI_YOLU = "osmaraclari/ilizle/veri/iller.json";

// İllerin ISO kodlarını eklemek en güvenli yoldur
const ILLER = [
  { iso: "TR-34", ad: "İstanbul", kod: "istanbul" },
  { iso: "TR-41", ad: "Kocaeli", kod: "kocaeli" },
  { iso: "TR-54", ad: "Sakarya", kod: "sakarya" },
  { iso: "TR-26", ad: "Eskişehir", kod: "eskisehir" },
  { iso: "TR-17", Çanakkale: "Çanakkale", kod: "canakkale" }
];

async function bekle(ms) {
  return new Promise(coz => setTimeout(coz, ms));
}

async function veriCek(il) {
  // Tek bir istekte tüm sayımları yapıyoruz
  const sorgu = `
    [out:json][timeout:300];
    area["ISO3166-2"="${il.iso}"]->.a;
    (
      nwr["building"](area.a);
      nwr["building"]["addr:housenumber"](area.a);
      nwr["highway"](area.a);
      nwr["highway"]["name"](area.a);
    );
    out count;
  `;

  try {
    const yanit = await fetch(OVERPASS_URL, {
      method: "POST",
      body: sorgu
    });

    if (!yanit.ok) throw new Error("Sunucu yanıt vermedi: " + yanit.status);

    const veri = await yanit.json();
    
    // Overpass count çıktısında elemanlar belirli bir sırayla gelir
    // 0: bina, 1: adresli bina, 2: yol, 3: isimli yol
    const sayimlar = veri.elements || [];
    
    if (sayimlar.length < 4) {
       throw new Error("Eksik veri döndü");
    }

    const bina = Number(sayimlar[0].tags.total);
    const adresliBina = Number(sayimlar[1].tags.total);
    const yol = Number(sayimlar[2].tags.total);
    const isimliYol = Number(sayimlar[3].tags.total);

    return {
      ad: il.ad,
      bina,
      adresli_bina: adresliBina,
      adres_orani: bina > 0 ? Number(((adresliBina / bina) * 100).toFixed(1)) : 0,
      yol,
      isimli_yol: isimliYol,
      guncelleme: new Date().toISOString().slice(0, 10)
    };
  } catch (hata) {
    console.error(`❌ ${il.ad} işlenirken aksaklık çıktı:`, hata.message);
    return {
      ad: il.ad,
      hata: true,
      not: hata.message,
      guncelleme: new Date().toISOString().slice(0, 10)
    };
  }
}

async function anaSurec() {
  console.log("⏳ OSM il sayımları başlatıldı");
  const sonuc = {};

  for (const il of ILLER) {
    console.log(`▶ ${il.ad} verisi derleniyor...`);
    const ilVerisi = await veriCek(il);
    sonuc[il.kod] = ilVerisi;
    
    // Her il arasında sunucuyu yormamak için uzun bir ara veriyoruz
    console.log(`✔ ${il.ad} tamamlandı. Bekleniyor...`);
    await bekle(15000); 
  }

  const dizin = "osmaraclari/ilizle/veri";
  if (!fs.existsSync(dizin)) {
    fs.mkdirSync(dizin, { recursive: true });
  }

  fs.writeFileSync(CIKTI_YOLU, JSON.stringify(sonuc, null, 2), "utf-8");
  console.log("✅ Tüm işlemler bitti ve dosya ak kâğıda yazıldı.");
}

anaSurec();
