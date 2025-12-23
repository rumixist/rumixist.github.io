import fs from "fs";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.nchc.org.tw/api/interpreter"
];

const ILLER = [
  { kod: "istanbul", ad: "İstanbul" },
  { kod: "kocaeli", ad: "Kocaeli" },
  { kod: "sakarya", ad: "Sakarya" },
  { kod: "eskisehir", ad: "Eskişehir" },
  { kod: "canakkale", ad: "Çanakkale" }
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchOverpass(query) {
  for (let i = 0; i < ENDPOINTS.length; i++) {
    try {
      const res = await fetch(ENDPOINTS[i], {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query
      });
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      return json.elements?.length ?? 0;
    } catch {
      await sleep(5000);
    }
  }
  return null;
}

function q(il, filter) {
  return `
[out:json][timeout:180];
{{geocodeArea:${il}}}->.a;
way${filter}(area.a);
out ids;
`;
}

const sonuc = {};
const tarih = new Date().toISOString().slice(0, 10);

for (const il of ILLER) {
  console.log("▶", il.ad);

  const bina = await fetchOverpass(q(il.ad, '["building"]'));
  await sleep(4000);

  const adresli = await fetchOverpass(q(il.ad, '["building"]["addr:housenumber"]'));
  await sleep(4000);

  const yol = await fetchOverpass(q(il.ad, '["highway"]'));
  await sleep(4000);

  const isimli = await fetchOverpass(q(il.ad, '["highway"]["name"]'));
  await sleep(8000);

  if (bina === null || yol === null) {
    sonuc[il.kod] = { ad: il.ad, hata: true, guncelleme: tarih };
    continue;
  }

  sonuc[il.kod] = {
    ad: il.ad,
    bina,
    adresli_bina: adresli ?? 0,
    adres_orani: bina ? Number(((adresli / bina) * 100).toFixed(1)) : 0,
    yol,
    isimli_yol: isimli ?? 0,
    guncelleme: tarih
  };

  await sleep(10000);
}

fs.mkdirSync("osmaraclari/ilizle/veri", { recursive: true });

fs.writeFileSync(
  "osmaraclari/ilizle/veri/iller.json",
  JSON.stringify(sonuc, null, 2),
  "utf-8"
);


