import requests
import json
import time
import os

# Verilerin kaydedileceği dosya yolu
DOSYA_YOLU = "osmaraclari/ilizle/veri/iller.json"

# Deneme amaçlı birkaç il seçildi.
# Tüm iller için bu listeyi genişletebilirsin.
ILLER = [
    "İstanbul",
    "Ankara",
    "İzmir",
    "Bursa",
    "Antalya"
]

def verileri_cek(il_adi):
    """
    Belirtilen il için Overpass API üzerinden sayıları çeker.
    Veriyi indirmek yerine 'out count' buyruğu ile sadece sayıları alır.
    """
    
    # Overpass sorgusu
    # [timeout:180] büyük iller için süre tanır.
    sorgu = f"""
    [out:json][timeout:180];
    area["name"="{il_adi}"]["admin_level"="4"]->.alan;
    
    // 1. Bina Sayısı (Yollar ve İlişkiler)
    (way["building"](area.alan); relation["building"](area.alan););
    out count;
    
    // 2. Adres Sayısı (Düğümler, Yollar ve İlişkiler)
    (node["addr:housenumber"](area.alan); way["addr:housenumber"](area.alan); relation["addr:housenumber"](area.alan););
    out count;
    
    // 3. Yol Sayısı
    way["highway"](area.alan);
    out count;
    
    // 4. İsimli Yol Sayısı
    way["highway"]["name"](area.alan);
    out count;
    """
    
    # Herkesin kullandığı genel sunucu
    url = "https://overpass-api.de/api/interpreter"
    
    try:
        yanit = requests.post(url, data={"data": sorgu})
        yanit.raise_for_status()
        veri = yanit.json()
        
        # Dönen yanıttaki öğeler sırasıyla sorgudaki 'out count' sıralamasıdır
        ogeler = veri.get("elements", [])
        
        if len(ogeler) < 4:
            print(f"{il_adi} için eksik veri döndü.")
            return None
            
        return {
            "il": il_adi,
            "bina_sayisi": int(ogeler[0]["tags"]["total"]),
            "adres_sayisi": int(ogeler[1]["tags"]["total"]),
            "yol_sayisi": int(ogeler[2]["tags"]["total"]),
            "isimli_yol_sayisi": int(ogeler[3]["tags"]["total"])
        }
        
    except Exception as e:
        print(f"{il_adi} işlenirken bir sorun oluştu: {e}")
        return None

def ana_islev():
    tum_veriler = {}
    
    print("Veri çekme işlemi başladı...")
    
    for il in ILLER:
        print(f"{il} için veriler alınıyor...")
        sonuc = verileri_cek(il)
        
        if sonuc:
            tum_veriler[il] = sonuc
        
        # Sunucuyu yormamak için kısa bir bekleme
        time.sleep(2)
        
    # Klasör yoksa oluştur
    dizin = os.path.dirname(DOSYA_YOLU)
    if dizin and not os.path.exists(dizin):
        os.makedirs(dizin)
        
    # JSON dosyasına yaz
    with open(DOSYA_YOLU, "w", encoding="utf-8") as dosya:
        json.dump(tum_veriler, dosya, ensure_ascii=False, indent=4)
        
    print(f"İşlem bitti. Veriler '{DOSYA_YOLU}' yoluna yazıldı.")

if __name__ == "__main__":
    ana_islev()

