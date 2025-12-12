// map.js - MapLibre GL JS tabanlı harita sistemi

// İstanbul orta nokta koordinatı [Boylam, Enlem]
const ISTANBUL_CENTER = [28.9784, 41.0082];
const START_ZOOM = 10;

// İstanbul sınırları [GB [Boylam, Enlem], KD [Boylam, Enlem]]
const ISTANBUL_BOUNDS = [
  [27.0, 40.4], // Güneybatı
  [30.5, 42.0]  // Kuzeydoğu
];

// Haritayı kur
const map = new maplibregl.Map({
  container: 'map',
  // Arka plan rengini belirten sade bir biçim tanımı
  style: {
    'version': 8,
    'sources': {},
    'layers': [
      {
        'id': 'background',
        'type': 'background',
        'paint': {
          'background-color': '#ffffff' // Ak arka plan
        }
      }
    ]
  },
  center: ISTANBUL_CENTER,
  zoom: START_ZOOM,
  minZoom: 9,
  maxZoom: 17,
  maxBounds: ISTANBUL_BOUNDS,
  dragRotate: false, // Harita dönmesini engelle
  touchPitch: false // Eğilmeyi engelle
});

// Kaydırma ve yakınlaştırma ayarları
map.scrollZoom.setWheelZoomRate(1 / 200); 

// Veri kaynağı ve katman ekleyen yardımcı işlev
function addGeoJsonLayer(url, id, type, color, widthOrOpacity, minZoom = 0) {
  // Nokta verilerini süzmek için filtre
  const filterNoPoint = ['!=', ['geometry-type'], 'Point'];

  map.addSource(id, {
    type: 'geojson',
    data: url
  });

  // Türüne göre boyama ayarları
  let paintSettings = {};
  
  if (type === 'fill') {
    paintSettings = {
      'fill-color': color,
      'fill-opacity': widthOrOpacity
    };
  } else if (type === 'line') {
    paintSettings = {
      'line-color': color,
      'line-width': widthOrOpacity,
      'line-opacity': 0.9
    };
  }

  map.addLayer({
    'id': id,
    'type': type,
    'source': id,
    'minzoom': minZoom,
    'filter': filterNoPoint,
    'paint': paintSettings
  });
  
  console.info(url + " kaynağı eklendi. En az yakınlaştırma: " + minZoom);
}

// Harita yüklendiğinde katmanları ekle
map.on('load', function () {
  
  // Su Katmanları (Dolgu tipi)
  // Renk: #2b7be4, Opaklık: 0.65
  const waterColor = "#2b7be4";
  const waterOpacity = 0.65;

  addGeoJsonLayer("data/sular/istanbulsular.geojson", "su-genel", "fill", waterColor, waterOpacity, 9);
  addGeoJsonLayer("data/sular/marmaradenizi.geojson", "su-marmara", "fill", waterColor, waterOpacity, 9);
  addGeoJsonLayer("data/sular/istanbulbogazi.geojson", "su-bogaz", "fill", waterColor, waterOpacity, 9);
  addGeoJsonLayer("data/sular/karadeniz.geojson", "su-karadeniz", "fill", waterColor, waterOpacity, 9);
  addGeoJsonLayer("data/sular/halic.geojson", "su-halic", "fill", waterColor, waterOpacity, 9);

  // Yol Katmanları (Çizgi tipi)
  
  // Otoyollar:
  addGeoJsonLayer("data/yollar/otoyol/otoyollar.geojson", "yol-otoyol", "line", "#c92b2b", 2, 9);

  // Birincil Yollar
  const birincilRenk = "#c9922bff";
  addGeoJsonLayer("data/yollar/birincil/asya.geojson", "yol-asya", "line", birincilRenk, 2, 10);
  addGeoJsonLayer("data/yollar/birincil/avrupa.geojson", "yol-avrupa", "line", birincilRenk, 2, 10);

  // İkincil Yollar
  const ikincilRenk = "#b7ae63ff";
  addGeoJsonLayer("data/yollar/ikincil/ikincilyollar.geojson", "yol-ikincil", "line", ikincilRenk, 2, 10);

  // Üçüncül Yollar
  const ucunculRenk = "#bbc198ff";
  addGeoJsonLayer("data/yollar/ucuncul/ucunculyollar.geojson", "yol-ucuncul", "line", ucunculRenk, 1.5, 10);

  // Yerleşim Yeri Yolları
  const yerlesimyeriRenk = "#a1a198ff";
  const yyMinZoom = 11.5;
  addGeoJsonLayer("data/yollar/yerlesimyeri/adalar.geojson", "yol-yerlesim-adalar", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/arnavutkoy.geojson", "yol-yerlesim-arnavutkoy", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/atasehir.geojson", "yol-yerlesim-atasehir", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/avcilar.geojson", "yol-yerlesim-avcilar", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/bagcilar.geojson", "yol-yerlesim-bagcilar", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/bahcelievler.geojson", "yol-yerlesim-bahcelievler", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/bakirkoy.geojson", "yol-yerlesim-bakirkoy", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/basaksehir.geojson", "yol-yerlesim-basaksehir", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/bayrampasa.geojson", "yol-yerlesim-bayrampasa", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/besiktas.geojson", "yol-yerlesim-besiktas", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/beykoz.geojson", "yol-yerlesim-beykoz", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/beylikduzu.geojson", "yol-yerlesim-beylikduzu", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/beyoglu.geojson", "yol-yerlesim-beyoglu", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/buyukcekmece.geojson", "yol-yerlesim-buyukcekmece", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/catalca.geojson", "yol-yerlesim-catalca", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/cekmekoy.geojson", "yol-yerlesim-cekmekoy", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/esenler.geojson", "yol-yerlesim-esenler", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/esenyurt.geojson", "yol-yerlesim-esenyurt", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/eyupsultan.geojson", "yol-yerlesim-eyupsultan", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/fatih.geojson", "yol-yerlesim-fatih", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/gaziosmanpasa.geojson", "yol-yerlesim-gaziosmanpasa", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/gungoren.geojson", "yol-yerlesim-gungoren", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/kadikoy.geojson", "yol-yerlesim-kadikoy", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/kagithane.geojson", "yol-yerlesim-kagithane", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/kartal.geojson", "yol-yerlesim-kartal", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/kucukcekmece.geojson", "yol-yerlesim-kucukcekmece", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/maltepe.geojson", "yol-yerlesim-maltepe", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/pendik.geojson", "yol-yerlesim-pendik", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/sancaktepe.geojson", "yol-yerlesim-sancaktepe", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/sariyer.geojson", "yol-yerlesim-sariyer", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/silivri.geojson", "yol-yerlesim-silivri", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/sultanbeyli.geojson", "yol-yerlesim-sultanbeyli", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/sultangazi.geojson", "yol-yerlesim-sultangazi", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/sile.geojson", "yol-yerlesim-sile", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/sisli.geojson", "yol-yerlesim-sisli", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/tuzla.geojson", "yol-yerlesim-tuzla", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/umraniye.geojson", "yol-yerlesim-umraniye", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/uskudar.geojson", "yol-yerlesim-uskudar", "line", yerlesimyeriRenk, 1, yyMinZoom);
  addGeoJsonLayer("data/yollar/yerlesimyeri/zeytinburnu.geojson", "yol-yerlesim-zeytinburnu", "line", yerlesimyeriRenk, 1, yyMinZoom);
  

  console.info("Tüm katmanlar başarıyla kuruldu.");
});