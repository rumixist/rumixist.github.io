/**
 * Veri Kaynağı Yapılandırması
 */
const VERI_URL = 'veri/iller.json';
const DEGISEM_URL = 'veri/degisiklik_90gun.json';


// Verileri tutacağımız dizelge (array)
let ilVerileri = [];

/* Yardımcılar */
const el = id => document.getElementById(id);
const sayiFmt = s => (s === null || s === undefined) ? '-' : s.toLocaleString('tr-TR');

/* Yükleme Simgesi Denetimi */
function yukleniyorGoster(durum) {
  const kutu = el('genelDurum');
  if (durum) kutu.classList.add('aktif');
  else kutu.classList.remove('aktif');
}

/* Verileri JSON dosyasından çekme işlevi */
async function verileriGetir() {
  yukleniyorGoster(true);
  el('durumMesaji').innerText = "Veri dosyası okunuyor...";

  try {
    const [yanitAna, yanitDegisim] = await Promise.all([
      fetch(VERI_URL),
      fetch(DEGISEM_URL)
    ]);
    
    if (!yanitAna.ok) throw new Error("Ana veri dosyası okunamadı.");
    if (!yanitDegisim.ok) throw new Error("Değişim veri dosyası okunamadı.");
    
    const hamVeri = await yanitAna.json();
    const degisimVeri = await yanitDegisim.json();


    // 🔴 ÖNCE FİLTRE: bina_sayisi 0 olan iller tamamen elenir
    ilVerileri = Object.keys(hamVeri)
      .filter(ilAdi => {
        const veri = hamVeri[ilAdi];
        return (veri.bina_sayisi || 0) > 0;
      })
      .map(ilAdi => {
        const veri = hamVeri[ilAdi];
        const degisimKaydi = degisimVeri[ilAdi] || null;

        const bina = veri.bina_sayisi || 0;
        const adres = veri.adres_sayisi || 0;
        const yol = veri.yol_sayisi || 0;
        const isimli = veri.isimli_yol_sayisi || 0;

        return {
          ad: veri.il || ilAdi,
          bina_sayisi: bina,
          adres_sayisi: adres,
          adres_orani: bina > 0 ? (adres / bina) * 100 : 0,
          yol_sayisi: yol,
          isimli_yol_sayisi: isimli,
          yol_orani: yol > 0 ? (isimli / yol) * 100 : 0,
          
          degisim: degisimKaydi ? degisimKaydi.degisiklik_90gun : null,
          degisim_tarihi: degisimKaydi ? degisimKaydi.son_guncelleme : null,
          
          son_guncelleme: veri.son_guncelleme || null
        };
      });

    el('durumMesaji').innerText = "Veriler hazır.";
    el('istatistikMesaji').innerText = `${ilVerileri.length} İl Yüklendi`;

    arayuzGuncelle();

  } catch (hata) {
    console.error(hata);
    el('anaListe').innerHTML =
      `<div style="text-align:center; padding:30px; color:red">
        Veri okuma hatası: ${hata.message}
      </div>`;
    el('durumMesaji').innerText = "Hata oluştu.";
  } finally {
    yukleniyorGoster(false);
  }
}

/* HTML Kart Üretimi */
function kartHtmlUret(veri) {
  
  function tarihAraligi(metin) {
    if (!metin) return 'Veri henüz yok';
    const bitis = new Date(metin);
    const baslangic = new Date(bitis);
    baslangic.setDate(baslangic.getDate() - 90);
  
    return `${baslangic.toLocaleDateString('tr-TR')} – ${bitis.toLocaleDateString('tr-TR')}`;
  }

  const degisimMetni =
    veri.degisim !== null
      ? `${veri.degisim > 0 ? '+' : ''}${sayiFmt(veri.degisim)}`
      : '-';

  const degisimSinifi = veri.degisim !== null ? 'deger degisim-artti' : 'deger';
  const degisimAciklama = veri.degisim !== null ? 'Son dönem değişimi' : 'Veri henüz yok';

  const guncellemeMetni = veri.son_guncelleme
    ? veri.son_guncelleme
    : 'Bilgi yok';

  return `
    <div class="kart">
      <div class="kart-baslik">
        <div class="il-adi">${veri.ad}</div>
        <div class="durum-metni">${guncellemeMetni}</div>
      </div>

      <div class="veri-izgarasi">
        <div class="veri-grubu">
          <div class="etiket">Toplam Bina</div>
          <div class="deger">${sayiFmt(veri.bina_sayisi)}</div>
          <div class="alt-bilgi">${sayiFmt(veri.adres_sayisi)} adresli</div>
          <div class="oran-cubugu">
            <div class="oran-doluluk" style="width:${veri.adres_orani}%"></div>
          </div>
          <div class="alt-bilgi" style="text-align:right">%${veri.adres_orani.toFixed(1)}</div>
        </div>

        <div class="veri-grubu">
          <div class="etiket">Toplam Sokak</div>
          <div class="deger">${sayiFmt(veri.yol_sayisi)}</div>
          <div class="alt-bilgi">${sayiFmt(veri.isimli_yol_sayisi)} isimli</div>
          <div class="oran-cubugu">
            <div class="oran-doluluk" style="width:${veri.yol_orani}%"></div>
          </div>
          <div class="alt-bilgi" style="text-align:right">%${veri.yol_orani.toFixed(1)}</div>
        </div>

        <div class="veri-grubu">
          <div class="etiket">Son 90'lük Haritalandırılma</div>
          <div class="${degisimSinifi}">${degisimMetni}</div>
          <div class="alt-bilgi">
            ${veri.degisim_tarihi ? tarihAraligi(veri.degisim_tarihi) : 'Veri henüz yok'}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* Sıralama ve Arama İşlevleri */
function arayuzGuncelle() {
  const aramaMetni = el('aramaKutusu').value.toLocaleLowerCase('tr');
  const siralamaTipi = el('siralamaSecimi').value;
  const listeKutusu = el('anaListe');

  let gosterilecek = ilVerileri.filter(il =>
    il.ad.toLocaleLowerCase('tr').includes(aramaMetni)
  );

  gosterilecek.sort((a, b) => {
    if (siralamaTipi === 'alfabetik') {
      return a.ad.localeCompare(b.ad, 'tr');
    }
    const degerA = a[siralamaTipi] || 0;
    const degerB = b[siralamaTipi] || 0;
    return degerB - degerA;
  });

  if (gosterilecek.length === 0) {
    listeKutusu.innerHTML =
      '<div style="text-align:center; padding:20px;">Kayıt bulunamadı.</div>';
    return;
  }

  listeKutusu.innerHTML = gosterilecek.map(kartHtmlUret).join('');
}

/* Olay Dinleyicileri */
el('aramaKutusu').addEventListener('input', arayuzGuncelle);
el('siralamaSecimi').addEventListener('change', arayuzGuncelle);

// Sayfa açıldığında başlat
window.addEventListener('DOMContentLoaded', verileriGetir);


