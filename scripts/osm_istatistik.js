const fs = require("fs");

const CIKTI_YOLU = "osmaraclari/ilizle/veri/iller.json";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const ILLER = [
  { kod: "istanbul", ad: "İstanbul", relation: 223474 },
  { kod: "kocaeli", ad: "Kocaeli", relation: 223499 },
  { kod: "sakarya", ad: "Sakarya", relation: 223555 },
  { kod: "eskisehir", ad: "Eskişehir", relation: 223401 },
  { kod: "canakkale", ad: "Çanakkale", relation: 223453 }
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

async function guvenliSay(sorgu, aciklama) {
  try {
    return await overpassCount(sorgu);
  } catch (e) {
    console.error("❌", aciklama, "hatası:", e.message);
    return null;
  }
}

async function ilIstatistik(iller) {
  const sonuc = {};
  const tarih = new Date().toISOString().slice(0, 10);

  for (const il of iller) {
    console.log("▶ İşleniyor:", il.ad);

    const alan = `
      relation(${il.relation});
      map_to_area->.a;
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

    if (bina === null || yol === null) {
      sonuc[il.kod] = {
        ad: il.ad,
        hata: true,
        guncelleme: tarih
      };
      console.log("⚠", il.ad, "eksik veri, atlandı");
      continue;
    }

    const adresOrani =
      bina > 0 && adresliBina !== null
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
    await sleep(10000);
  }

  return sonuc;
}

(async () => {
  console.log("⏳ İstatistikler başlıyor");

  const veri = await ilIstatistik(ILLER);

  fs.mkdirSync("osmaraclari/ilizle/veri", { recursive: true });
  fs.writeFileSync(CIKTI_YOLU, JSON.stringify(veri, null, 2), "utf-8");

  console.log("✅ iller.json yazıldı:", CIKTI_YOLU);
})();
