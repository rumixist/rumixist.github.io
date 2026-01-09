import requests
import json
import time
import os
from datetime import datetime

DOSYA_YOLU = "osmaraclari/ilizle/veri/degisiklik_90gun.json"

ILLER = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
    "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
    "Diyarbakır", "Edirne", "Elâzığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri",
    "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
    "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
]

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

from datetime import datetime, timedelta

def degisiklik_sayisi_cek(il_adi, deneme_sayisi=3):
    tarih_90gun_once = (datetime.utcnow() - timedelta(days=90)).strftime("%Y-%m-%dT%H:%M:%SZ")

    sorgu = f'''
    [out:json][timeout:180];
    area["boundary"="administrative"]["admin_level"="4"]["name"="{il_adi}"]->.alan;

    (
      node(area.alan)(newer:"{tarih_90gun_once}");
      way(area.alan)(newer:"{tarih_90gun_once}");
      relation(area.alan)(newer:"{tarih_90gun_once}");
    );
    out count;
    '''

    for i in range(deneme_sayisi):
        try:
            r = requests.post(OVERPASS_URL, data={"data": sorgu}, timeout=200)

            if r.status_code == 429:
                time.sleep((i + 1) * 20)
                continue

            r.raise_for_status()
            veri = r.json()
            elemanlar = veri.get("elements", [])

            if not elemanlar:
                return 0   # veri yok ama hata da yok

            return int(elemanlar[0]["tags"]["total"])

        except Exception as e:
            time.sleep(10)

    return None

def ana():
    sonuc = {}

    for i, il in enumerate(ILLER, start=1):
        print(f"[{i}/{len(ILLER)}] {il} işleniyor")

        sayi = degisiklik_sayisi_cek(il)

        if sayi is not None:
            sonuc[il] = {
                "degisiklik_90gun": sayi,
                "son_guncelleme": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            print(f"  -> {sayi}")
        else:
            print("  -> veri alınamadı")

        time.sleep(8)

    os.makedirs(os.path.dirname(DOSYA_YOLU), exist_ok=True)

    with open(DOSYA_YOLU, "w", encoding="utf-8") as f:
        json.dump(sonuc, f, ensure_ascii=False, indent=4)

    print("Bitti.")

if __name__ == "__main__":
    ana()
