const fs = require("fs");

const CIKTI_YOLU = "osmaraclari/ilizle/veri/iller.json";

const ILLER = [
  { kod: "istanbul", ad: "İstanbul", relation: 223474 },
  { kod: "kocaeli", ad: "Kocaeli", relation: 223499 },
  { kod: "sakarya", ad: "Sakarya", relation: 223555 },
  { kod: "eskisehir", ad: "Eskişehir", relation: 223401 },
  { kod: "canakkale", ad: "Çanakkale", relation: 223453 }
];

async function overpassCount(sorgu) {
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: sorgu,
    headers: {
      "Content-Type": "text/plain"
    }
  });

  if (!res.ok) {
    throw new Error("Overpass hata: " + res.status);
  }

  const json = await res.json();

  const eleman = json.elements?.[0];
  if (!eleman || !eleman.tags) return 0;

  // out count sonucunda way sayısı burada gelir
  return Number(eleman.tags.ways ?? 0);
}

async function ilIstatistik(iller) {
  const sonuc = {};
  const tarih = new Date().toISOString().slice(0, 10);

  for (const il of iller) {
    console.log("İşleniyor:", il.ad);

    try {
      const alan = `
        relation(${il.relation});
        map_to_area->.a;
      `;

      const binaSorgu = `
        [out:json][timeout:180];
        ${alan}
        way["building"](area.a);
        out count;
      `;

      const adresliBinaSorgu = `
        [out:json][timeout:180];
        ${alan}
        way["building"]["addr:housenumber"](area.a);
        out count;
      `;

      const yolSorgu = `
        [out:json][timeout:180];
        ${alan}
        way["highway"](area.a);
        out count;
      `;

      const isimliYolSorgu = `
        [out:json][timeout:180];
        ${alan}
        way["highway"]["name"](area.a);
        out count;
      `;

      const bina = await overpassCount(binaSorgu);
      const adresliBina = await overpassCount(adresliBinaSorgu);
      const yol = await overpassCount(yolSorgu);
      const isimliYol = await overpassCount(isimliYolSorgu);

      const adresOrani =
        bina > 0 ? Number(((adresliBina / bina) * 100).toFixed(1)) : 0;

      sonuc[il.kod] = {
        ad: il.ad,
        bina,
        adresli_bina: adresliBina,
        adres_orani: adresOrani,
        yol,
        isimli_yol: isimliYol,
        guncelleme: tarih
      };

    } catch (hata) {
      console.error("Hata:", il.ad, hata.message);
      sonuc[il.kod] = {
        ad: il.ad,
        hata: true,
        guncelleme: tarih
      };
    }
  }

  return sonuc;
}

(async () => {
  const veri = await ilIstatistik(ILLER);

  fs.mkdirSync("osmaraclari/ilizle/veri", { recursive: true });
  fs.writeFileSync(
    CIKTI_YOLU,
    JSON.stringify(veri, null, 2),
    "utf-8"
  );

  console.log("✔ iller.json yazıldı:", CIKTI_YOLU);
})();
