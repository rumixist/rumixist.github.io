import requests
import json
import time
import os
from datetime import datetime

# Dosya yolu
DOSYA_YOLU = "osmaraclari/ilizle/veri/iller.json"

# Tüm illeri buraya ekleyebilirsin.
ILLER = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
    "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
    "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
    "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
    "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
]

def verileri_cek(il_adi, deneme_sayisi=3):
    """
    Overpass API'den veriyi çeker. Hata alırsa belirtilen sayıda tekrar dener.
    """
    # DÜZELTME: Dış tırnakları tek tırnak (''') yaptık ki içerdeki çift tırnaklarla karışmasın.
    sorgu = f'''
    [out:json][timeout:180];
    area["name"="{il_adi}"]["admin_level"="4"]->.alan;
    (way["building"](area.alan); relation["building"](area.alan););
    out count;
    (node["addr:housenumber"](area.alan); way["addr:housenumber"](area.alan); relation["addr:housenumber"](area.alan););
    out count;
    way["highway"](area.alan);
    out count;
    way["highway"]["name"](area.alan);
    out count;
    '''
    
    url = "https://overpass-api.de/api/interpreter"
    
    for i in range(deneme_sayisi):
        try:
            # timeout=200 diyerek python tarafında da bekleme süresi koyuyoruz
            yanit = requests.post(url, data={"data": sorgu}, timeout=200)
            
            # Eğer 429 (Çok fazla istek) hatası gelirse biraz uzun bekle
            if yanit.status_code == 429:
                print(f"{il_adi}: Sunucu meşgul (429), { (i+1) * 10 } saniye bekleniyor...")
                time.sleep((i + 1) * 10)
                continue
                
            yanit.raise_for_status()
            veri = yanit.json()
            
            ogeler = veri.get("elements", [])
            
            if len(ogeler) < 4:
                print(f"{il_adi}: Eksik veri döndü.")
                return None
            
            # Şu anki tarihi al
            guncel_tarih = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            return {
                "il": il_adi,
                "bina_sayisi": int(ogeler[0]["tags"]["total"]),
                "adres_sayisi": int(ogeler[1]["tags"]["total"]),
                "yol_sayisi": int(ogeler[2]["tags"]["total"]),
                "isimli_yol_sayisi": int(ogeler[3]["tags"]["total"]),
                "son_guncelleme": guncel_tarih
            }
            
        except Exception as e:
            print(f"{il_adi}: Hata oluştu (Deneme {i+1}/{deneme_sayisi}) - {e}")
            time.sleep(5) # Hata sonrası kısa bekleme
            
    print(f"{il_adi}: Tüm denemeler başarısız oldu.")
    return None

def ana_islev():
    # 1. ADIM: Önce eski dosyayı oku (Varsa)
    tum_veriler = {}
    if os.path.exists(DOSYA_YOLU):
        try:
            with open(DOSYA_YOLU, "r", encoding="utf-8") as dosya:
                tum_veriler = json.load(dosya)
            print(f"Mevcut dosya okundu. {len(tum_veriler)} il var.")
        except Exception as e:
            print(f"Dosya okuma hatası: {e}. Yeni dosya oluşturulacak.")
            tum_veriler = {}
    
    print("Veri güncelleme işlemi başladı...")
    
    sayac = 0
    for il in ILLER:
        # İlerleme durumunu görmek için
        sayac += 1
        print(f"[{sayac}/{len(ILLER)}] {il} işleniyor...")
        
        yeni_veri = verileri_cek(il)
        
        if yeni_veri:
            # Başarılıysa listeyi güncelle
            tum_veriler[il] = yeni_veri
            print(f" > {il} güncellendi.")
        else:
            # Başarısızsa eski veriye dokunma, sadece bildir
            eski_tarih = tum_veriler.get(il, {}).get("son_guncelleme", "Yok")
            print(f" ! {il} güncellenemedi. Eski veri korunuyor (Tarih: {eski_tarih}).")
        
        # Sunucuyu yormamak için her ilden sonra bekleme
        time.sleep(5)
        
    # Klasör yoksa oluştur
    dizin = os.path.dirname(DOSYA_YOLU)
    if dizin and not os.path.exists(dizin):
        os.makedirs(dizin)
        
    # Dosyayı kaydet
    with open(DOSYA_YOLU, "w", encoding="utf-8") as dosya:
        json.dump(tum_veriler, dosya, ensure_ascii=False, indent=4)
        
    print(f"İşlem bitti. Veriler '{DOSYA_YOLU}' yoluna yazıldı.")

if __name__ == "__main__":
    ana_islev()
