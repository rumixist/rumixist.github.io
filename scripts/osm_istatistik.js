const fs = require("fs");

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const CIKTI_YOLU = "osmaraclari/ilizle/veri/iller.json";

const ILLER = [
  { ad: "İstanbul", kod: "istanbul" },
  { ad: "Kocaeli", kod: "kocaeli" },
  { ad: "Sakarya", kod: "sakarya" },
  { ad: "Eskişehir", kod: "eskisehir" },
  { ad: "Çanakkale", kod: "canakkale" }
];

async function bekle(ms) {
  return new Promise(coz => setTimeout(coz, ms));
}

async function tekliSorgu(ilAd, ozellik) {
  // Alanı hem adı hem de yönetim düzeyi ile arayarak sağlama alıyoruz
  const alanTanimi = `area["name"="${ilAd}"]["admin_level"="4"]->.a;`;
  let nesneSecimi = "";

  if (ozellik === "bina") nesneSecimi = 'nwr["building"](area.a);';
  else if (ozellik === "adres") nesneSecimi = 'nwr["building"]["addr:housenumber"](area.a);';
  else if (ozellik === "yol") nesneSecimi = 'nwr["highway"](area.a);';
  else if (ozellik === "isimliyol") nesneSecimi = 'nwr["highway"]["name"](area.a);';

  const sorgu = `[out:json][timeout:180];${alanTanimi}${nesneSecimi}out count;`;

  const yanit = await fetch(OVERPASS_URL, {
    method: "POST",
    body: sorgu
  });

  if (!yanit.ok) throw new Error(`${yanit.status} yanıtı alındı`);

  const veri = await yanit.json();
  const sonuc = veri.elements && veri.elements[0] ? Number(veri.elements[0].tags.total) : 0;
  return sonuc;
}

async function ilisleyis(il) {
  console.log(`▶ ${il.ad} için veriler parça parça çekiliyor...`);
  
  try {
    const bina = await tekliSorgu(il.ad, "bina");
    await bekle(10000); 
    
    const adres = await tekliSorgu(il.ad, "adres");
    await bekle(10000);
    
    const yol = await tekliSorgu(il.ad, "yol");
    await bekle(10000);
    
    const isimliyol = await tekliSorgu(il.ad, "isimliyol");

    return {
      ad: il.ad,
      bina,
      adresli_bina: adres,
      adres_orani: bina > 0 ? Number(((adres / bina) * 100).toFixed(1)) : 0,
      yol,
      isimli_yol: isimliyol,
      guncelleme: new Date().toISOString().slice(0, 10)
    };
  } catch (aksaklik) {
    console.error(`❌ ${il.ad} başarısız:`, aksaklik.message);
    return null;
  }
}

async function anaSurec() {
  const sonuc = {};

  for (const il of ILLER) {
    const veri = await ilisleyis(il);
    if (veri) {
      sonuc[il.kod] = veri;
      console.log(`✔ ${il.ad} verisi başarıyla eklendi.`);
    } else {
      sonuc[il.kod] = { ad: il.ad, hata: true, guncelleme: new Date().toISOString().slice(0, 10) };
    }
    // İller arasında uzun bir dinlenme süresi bırakıyoruz
    await bekle(20000);
  }

  const dizin = "osmaraclari/ilizle/veri";
  if (!fs.existsSync(dizin)) fs.mkdirSync(dizin, { recursive: true });

  fs.writeFileSync(CIKTI_YOLU, JSON.stringify(sonuc, null, 2), "utf-8");
  console.log("✅ İşlem tamamlandı.");
}

anaSurec();
