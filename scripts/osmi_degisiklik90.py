import requests
import json
import time
import os
from datetime import datetime, timedelta

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

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]

HEADERS = {
    "User-Agent": "OSMIlIstatistikBot/1.0"
}


def degisiklik_sayisi_cek(il_adi, deneme_sayisi=3):

    tarih_90gun_once = (
        datetime.utcnow() - timedelta(days=90)
    ).strftime("%Y-%m-%dT%H:%M:%SZ")

    sorgu = f'''
    [out:json][timeout:300];

    area
      ["boundary"="administrative"]
      ["admin_level"="4"]
      ["name"="{il_adi}"]
    ->.alan;

    (
      node(area.alan)(newer:"{tarih_90gun_once}");
      way(area.alan)(newer:"{tarih_90gun_once}");
      relation(area.alan)(newer:"{tarih_90gun_once}");
    );

    out count;
    '''

    for deneme in range(deneme_sayisi):

        for url in OVERPASS_URLS:

            try:
                print(f"{il_adi} -> Sunucu deneniyor: {url}")

                r = requests.post(
                    url,
                    data={"data": sorgu},
                    headers=HEADERS,
                    timeout=300
                )

                print(f"{il_adi} -> HTTP {r.status_code}")

                if r.status_code == 429:
                    bekleme = (deneme + 1) * 30
                    print(f"{il_adi} -> Rate limit. {bekleme} saniye bekleniyor.")
                    time.sleep(bekleme)
                    continue

                r.raise_for_status()

                veri = r.json()

                elemanlar = veri.get("elements", [])

                if not elemanlar:
                    print(f"{il_adi} -> Veri yok.")
                    return 0

                toplam = int(elemanlar[0]["tags"]["total"])

                print(f"{il_adi} -> Başarılı. Toplam: {toplam}")

                return toplam

            except Exception as e:
                print(f"{il_adi} -> HATA ({url})")
                print(repr(e))

                time.sleep(10)

    print(f"{il_adi} -> Tüm denemeler başarısız.")

    return None


def ana():

    sonuc = {}

    basarili_sayisi = 0

    for i, il in enumerate(ILLER, start=1):

        print(f"\n[{i}/{len(ILLER)}] {il} işleniyor")

        sayi = degisiklik_sayisi_cek(il)

        if sayi is not None:

            sonuc[il] = {
                "degisiklik_90gun": sayi,
                "son_guncelleme": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }

            basarili_sayisi += 1

            print(f"{il} -> Kaydedildi")

        else:
            print(f"{il} -> Veri alınamadı")

        # Overpass sunucusunu boğmamak için
        time.sleep(15)

    if basarili_sayisi == 0:
        raise Exception("Hiçbir il verisi alınamadı.")

    os.makedirs(os.path.dirname(DOSYA_YOLU), exist_ok=True)

    with open(DOSYA_YOLU, "w", encoding="utf-8") as f:
        json.dump(sonuc, f, ensure_ascii=False, indent=4)

    print("\nBitti.")
    print(f"Başarılı il sayısı: {basarili_sayisi}")


if __name__ == "__main__":
    ana()
