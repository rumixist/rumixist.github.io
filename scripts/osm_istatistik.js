const fs = require("fs");

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const CIKTI_YOLU = "osmaraclari/ilizle/veri/iller.json";

// İstersen buraya 81 ilin tamamını ekleyebilirsin
const ILLER = [
  { kod: "istanbul", ad: "İstanbul" },
  { kod: "kocaeli", ad: "Kocaeli" },
  { kod: "sakarya", ad: "Sakarya" },
  { kod: "eskisehir", ad: "Eskişehir" },
  { kod: "canakkale", ad: "Çanakkale" }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function overpassCount(sorgu) {
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: sorgu
  });

  if (!res.ok) {
    throw new Error("HTTP hata: " + res.status);
  }

  const json = await res.json();

  if (!json.elements || json.elements.length === 0) {
    throw new Error("Boş Overpass cevabı");
  }

  const countElem = json.elements.find(e => e.type === "count");
  if (!countElem || !countElem.tags) {
    throw new Error("Count sonucu yok");
  }

  return Number(countElem.tags.ways || 0);
}

async function guvenliSay(sorgu, etiket) {
  try {
    return await overpassCount(sorgu);
  } catch (e) {
    console.error("❌", etiket, "→", e.message);
    return null;
  }
}

async function ilIstatistik(iller) {
  const sonuc = {};
  const tarih = new Date().toISOString().slice(0, 10);

  for (const il of iller) {
    console.log("▶ İşleniyor:", il.ad);

    // EN KRİTİK DEĞİŞİKLİK: relation YOK, indexed area VAR
    const alan = `
      area
        ["name"="${il.ad}"]
        ["boundary"="administrative"]
        ["admin_level"="4"]
      ->.a;
    `;

    const binaSorgu = `
      [out:json][timeout:300];
      ${alan}
      way["building"](area.a);
      out count;
    `;

    const adresliBinaSorgu = `
      [out:json][timeout:300];
      ${alan}
      way["building"]["addr:housenumber"](area.a);
      out count;
    `;

    const yolSorgu = `
      [out:json][timeout:300];
      ${alan}
      way["highway"](area.a);
      out count;
    `;

    const isimliYolSorgu = `
      [out:json][timeout:300];
      ${alan}
      way["highway"]["name"](area.a);
      out count;
    `;

    const bina = await guvenliSay(binaSorgu, il.ad + " bina");
    await sleep(5000);

    const adresliBina = await guvenliSay(adresliBinaSorgu, il.ad + " adresli bina");
    await sleep(5000);

    const yol = await guvenliSay(yolSorgu, il.ad + " yol");
    await sleep(5000);

    const isimliYol = await guvenliSay(isimliYolSorgu, il.ad + " isimli yol");
    await sleep(8000);

    // Sessiz 0’ları bilimsel olarak reddediyoruz
    if (
      bina === null ||
      yol === null ||
      (bina === 0 && yol === 0)
    ) {
      sonuc[il.kod] = {
        ad: il.ad,
        hata: true,
        not: "Alan bulunamadi veya Overpass veri dondurmedi",
        guncelleme: tarih
      };
      console.log("⚠", il.ad, "alan sorunu");
      await sleep(10000);
      continue;
    }

    const adresOrani =
      adresliBina !== null && bina > 0
        ? Number(((adresliBina / bina) * 100).toFixed(1))
        : 0;

    sonuc[il.kod] = {
      ad: il.ad,
      bina,
      adresli_bina: adresliBina ?? 0,
      adres_orani: adresOrani,
      yol,
      isimli_yol: isimliYol ?? 0,
      guncelleme: tarih
    };

    console.log("✔", il.ad, "tamamlandı");
    await sleep(12000); // il arası nefes
  }

  return sonuc;
}

(async () => {
  console.log("⏳ OSM il istatistikleri başlıyor");

  const veri = await ilIstatistik(ILLER);

  fs.mkdirSync("osmaraclari/ilizle/veri", { recursive: true });
  fs.writeFileSync(CIKTI_YOLU, JSON.stringify(veri, null, 2), "utf-8");

  console.log("✅ iller.json yazıldı:", CIKTI_YOLU);
})();
