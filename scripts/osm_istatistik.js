import fs from "fs";

/**
 * STABİL OVERPASS ENDPOINTLERİ
 */
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

/**
 * DENEME İLLERİ
 */
const ILLER = [
  { kod: "istanbul", ad: "İstanbul" },
  { kod: "kocaeli", ad: "Kocaeli" },
  { kod: "sakarya", ad: "Sakarya" },
  { kod: "eskisehir", ad: "Eskişehir" },
  { kod: "canakkale", ad: "Çanakkale" }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * OVERPASS FETCH
 * - Endpoint sırayla denenir
 * - Hatalar toplanır
 */
async function fetchOverpass(query) {
  const errors = [];

  for (const endpoint of ENDPOINTS) {
    try {
      console.log("   → deneme:", endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          "User-Agent": "rumixist-osm-bot/1.0 (github-actions)"
        },
        body: query
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      if (!json.elements) {
        throw new Error("elements yok");
      }

      return {
        ok: true,
        count: json.elements.length,
        endpoint
      };

    } catch (e) {
      console.warn("   ✗ hata:", endpoint, e.message);
      errors.push(`${endpoint}: ${e.message}`);
      await sleep(5000);
    }
  }

  return {
    ok: false,
    error: errors.join(" | ")
  };
}

/**
 * OVERPASS SORGUSU
 * ⚠️ geocodeArea MUTLAKA TIRNAKLI
 */
function q(il, filter) {
  return `
[out:json][timeout:120];
{{geocodeArea:"${il}"}}->.a;
way${filter}(area.a);
out ids;
`;
}

const sonuc = {};
const tarih = new Date().toISOString().slice(0, 10);

/**
 * ANA DÖNGÜ
 */
for (const il of ILLER) {
  console.log("▶", il.ad);

  try {
    const binaR = await fetchOverpass(q(il.ad, '["building"]'));
    await sleep(4000);

    const adresliR = await fetchOverpass(
      q(il.ad, '["building"]["addr:housenumber"]')
    );
    await sleep(4000);

    const yolR = await fetchOverpass(q(il.ad, '["highway"]'));
    await sleep(4000);

    const isimliR = await fetchOverpass(
      q(il.ad, '["highway"]["name"]')
    );
    await sleep(8000);

    if (!binaR.ok || !yolR.ok) {
      throw new Error(
        `bina: ${binaR.error ?? "ok"} | yol: ${yolR.error ?? "ok"}`
      );
    }

    const bina = binaR.count;
    const adresli = adresliR.ok ? adresliR.count : 0;
    const yol = yolR.count;
    const isimli = isimliR.ok ? isimliR.count : 0;

    sonuc[il.kod] = {
      ad: il.ad,
      bina,
      adresli_bina: adresli,
      adres_orani: bina
        ? Number(((adresli / bina) * 100).toFixed(1))
        : 0,
      yol,
      isimli_yol: isimli,
      guncelleme: tarih
    };

    console.log("   ✔ tamamlandı");

  } catch (e) {
    console.error("❌", il.ad, e.message);

    sonuc[il.kod] = {
      ad: il.ad,
      hata: true,
      hata_nedeni: "Overpass sorgusu basarisiz",
      hata_detay: e.message,
      guncelleme: tarih
    };
  }

  // İller arası nefes
  await sleep(10000);
}

/**
 * JSON YAZ
 */
fs.mkdirSync("osmaraclari/ilizle/veri", { recursive: true });

fs.writeFileSync(
  "osmaraclari/ilizle/veri/iller.json",
  JSON.stringify(sonuc, null, 2),
  "utf-8"
);

console.log("✅ iller.json yazildi");
