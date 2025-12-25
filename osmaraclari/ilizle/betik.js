let tumSehirler = [];
let gosterilenSehirler = [];

fetch("veri/iller.json")
    .then(res => res.json())
    .then(veri => {
        tumSehirler = Object.values(veri).map(il => {
            const adresOran = il.bina_sayisi
                ? (il.adres_sayisi / il.bina_sayisi) * 100
                : 0;

            const isimliYolOran = il.yol_sayisi
                ? (il.isimli_yol_sayisi / il.yol_sayisi) * 100
                : 0;

            return {
                ...il,
                adres_oran: adresOran,
                isimli_yol_oran: isimliYolOran
            };
        });

        gosterilenSehirler = [...tumSehirler];
        kartlariCiz();
    });

const kartAlan = document.getElementById("kartlar");
const aramaInput = document.getElementById("arama");
const siralamaSelect = document.getElementById("siralama");

aramaInput.addEventListener("input", filtreleVeSirala);
siralamaSelect.addEventListener("change", filtreleVeSirala);

function filtreleVeSirala() {
    const aramaMetni = aramaInput.value.toLowerCase();
    const siralama = siralamaSelect.value;

    gosterilenSehirler = tumSehirler.filter(il =>
        il.il.toLowerCase().includes(aramaMetni)
    );

    gosterilenSehirler.sort((a, b) => {
        switch (siralama) {
            case "alfabetik":
                return a.il.localeCompare(b.il, "tr");
            case "bina":
                return b.bina_sayisi - a.bina_sayisi;
            case "adres":
                return b.adres_sayisi - a.adres_sayisi;
            case "adres_oran":
                return b.adres_oran - a.adres_oran;
            case "yol":
                return b.yol_sayisi - a.yol_sayisi;
            case "isimli_yol":
                return b.isimli_yol_sayisi - a.isimli_yol_sayisi;
            case "isimli_yol_oran":
                return b.isimli_yol_oran - a.isimli_yol_oran;
            default:
                return 0;
        }
    });

    kartlariCiz();
}

function kartlariCiz() {
    kartAlan.innerHTML = "";

    gosterilenSehirler.forEach(il => {
        const kart = document.createElement("div");
        kart.className = "kart";

        kart.innerHTML = `
            <h2>${il.il}</h2>
            <ul>
                <li>Bina sayısı: ${il.bina_sayisi.toLocaleString()}</li>
                <li>Adresli bina: ${il.adres_sayisi.toLocaleString()}</li>
                <li class="oran">Adres/Bina oranı: %${il.adres_oran.toFixed(2)}</li>
                <li>Toplam yol: ${il.yol_sayisi.toLocaleString()}</li>
                <li>Adlı yol: ${il.isimli_yol_sayisi.toLocaleString()}</li>
                <li class="oran">Adlı yol/Yol oranı: %${il.isimli_yol_oran.toFixed(2)}</li>
            </ul>
        `;

        kartAlan.appendChild(kart);
    });
}
