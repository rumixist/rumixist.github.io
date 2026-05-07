import requests
import json
import time
import os
from datetime import datetime

DOSYA_YOLU = "osmaraclari/ilizle/veri/iller.json"

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


def verileri_cek(il_adi, deneme_sayisi=3):

    sorgu = f'''
    [out:json][timeout:300];

    area
      ["name"="{il_adi}"]
      ["admin_level"="4"]
    ->.alan;

    (
      way["building"]["building"!="greenhouse"]["shelter_type"!="gazebo"](area.alan);
      relation["building"]["building"!="greenhouse"]["shelter_type"!="gazebo"](area.alan);
    );
    out count;

    (
      node["addr:housenumber"](area.alan);
      way["addr:housenumber"](area.alan);
      relation["addr:housenumber"](area.alan);
    );
    out count;

    way["highway"](area.alan);
    out count;

    way["highway"]["name"](area.alan);
    out count;
    '''

    for deneme in range(deneme_sayisi):

        for url in OVERPASS_URLS:

            try:
                print(f"{il_adi} -> Sunucu deneniyor: {url}")

                yanit = requests.post(
                    url,
                    data={"data": sorgu},
                    headers=HEADERS,
                    timeout=300
                )

                print(f"{il_adi} -> HTTP {yanit.status_code}")

                if yanit.status_code == 429:

                    bekleme = (deneme + 1) * 30

                    print(f"{il_adi} -> Rate limit. {bekleme} saniye bekleniyor.")

                    time.sleep(bekleme)

                    continue

                yanit.raise_for_status()

                veri = yanit.json()

                ogeler = veri.get("elements", [])

                if len(ogeler) < 4:
                    print(f"{il_adi} -> Eksik veri döndü.")
                    continue

                sonuc = {
                    "il": il_adi,
                    "bina_sayisi": int(ogeler[0]["tags"]["total"]),
                    "adres_sayisi": int(ogeler[1]["tags"]["total"]),
                    "yol_sayisi": int(ogeler[2]["tags"]["total"]),
                    "isimli_yol_sayisi": int(ogeler[3]["tags"]["total"]),
                    "son_guncelleme": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }

                print(f"{il_adi} -> Başarılı")

                return sonuc

            except Exception as e:

                print(f"{il_adi} -> HATA ({url})")
                print(repr(e))

                time.sleep(10)

    print(f"{il_adi} -> Tüm denemeler başarısız.")

    return None


def ana_islev():

    tum_veriler = {}

    if os.path.exists(DOSYA_YOLU):

        try:
            with open(DOSYA_YOLU, "r", encoding="utf-8") as dosya:
                tum_veriler = json.load(dosya)

            print(f"Mevcut dosya okundu. {len(tum_veriler)} il var.")

        except Exception as e:

            print("Dosya okunamadı.")
            print(repr(e))

            tum_veriler = {}

    print("Veri güncelleme işlemi başladı...")

    basarili_sayisi = 0

    for i, il in enumerate(ILLER, start=1):

        print(f"\n[{i}/{len(ILLER)}] {il} işleniyor")

        yeni_veri = verileri_cek(il)

        if yeni_veri:

            tum_veriler[il] = yeni_veri

            basarili_sayisi += 1

            print(f"{il} -> Güncellendi")

        else:

            eski_tarih = tum_veriler.get(il, {}).get(
                "son_guncelleme",
                "Yok"
            )

            print(
                f"{il} -> Güncellenemedi. "
                f"Eski veri korunuyor. ({eski_tarih})"
            )

        # Sunucuyu boğmamak için
        time.sleep(15)

    if basarili_sayisi == 0:
        raise Exception("Hiçbir il verisi alınamadı.")

    dizin = os.path.dirname(DOSYA_YOLU)

    if dizin and not os.path.exists(dizin):
        os.makedirs(dizin)

    with open(DOSYA_YOLU, "w", encoding="utf-8") as dosya:

        json.dump(
            tum_veriler,
            dosya,
            ensure_ascii=False,
            indent=4
        )

    print("\nİşlem tamamlandı.")
    print(f"Başarılı il sayısı: {basarili_sayisi}")


if __name__ == "__main__":
    ana_islev()
