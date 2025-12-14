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
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
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
  maxZoom: 20,
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

  let paintSettings = {};

  if (type === 'fill') {
    paintSettings = {
      'fill-color': color,
      'fill-opacity': widthOrOpacity
    };

  } else if (type === 'line' && typeof widthOrOpacity === 'number') {
    paintSettings = {
      'line-color': color,
      'line-width': widthOrOpacity,
      'line-opacity': 0.9
    };

  } else if (type === 'line' && widthOrOpacity === 'ilce-sinir') {
    paintSettings = {
      'line-color': color,
      'line-width': 1,
      'line-opacity': 0.9,
      'line-dasharray': [2, 2] // 2 çizgi, 2 boşluk
    };
  }

  map.addLayer({
    'id': id,
    'type': type, // kesikli de olsa type line olmak zorunda
    'source': id,
    'minzoom': minZoom,
    'filter': filterNoPoint,
    'paint': paintSettings
  });

  console.info(url + " kaynağı eklendi. En az yakınlaştırma: " + minZoom);
}


// Yol isimleri (name / ref) için label katmanı ekler
function addRoadLabelLayer(sourceId, layerId, minZoom, textSize) {
  map.addLayer({
    id: layerId,
    type: "symbol",
    source: sourceId,
    minzoom: minZoom,
    layout: {
      "symbol-placement": "line",
      "text-field": [
        "coalesce",
        ["get", "name"],
        ["get", "ref"]
      ],
      "text-size": textSize,
      "text-rotation-alignment": "map",
      "text-keep-upright": true,
      "text-max-angle": 30,
      "text-padding": 2,
      "text-allow-overlap": false
    },
    paint: {
      "text-color": "#333333",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.5
    }
  });
}


// Harita yüklendiğinde katmanları ekle
map.on('load', function () {
  
  // Su Katmanları (Dolgu tipi)
  // Renk: #2b7be4, Opaklık: 0.65
  const waterColor = "#2b7be4";
  const waterOpacity = 0.4;

  addGeoJsonLayer("data/sular/istanbulsular.geojson", "su-genel", "fill", waterColor, waterOpacity, 9);
  addGeoJsonLayer("data/sular/marmaradenizi.geojson", "su-marmara", "fill", waterColor, waterOpacity, 9);
  addGeoJsonLayer("data/sular/istanbulbogazi.geojson", "su-bogaz", "fill", waterColor, waterOpacity, 9);
  addGeoJsonLayer("data/sular/karadeniz.geojson", "su-karadeniz", "fill", waterColor, waterOpacity, 9);
  addGeoJsonLayer("data/sular/halic.geojson", "su-halic", "fill", waterColor, waterOpacity, 9);


  //Yapılar (Dolgu tipi)

  const buildingColor = "#8a8a8aff";
  const buildingOpacity = 0.7;
  const buildingMinZoom = 14;

  addGeoJsonLayer("data/yapilar/adalar.geojson", "binalar-adalar", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/arnavutkoy.geojson", "binalar-arnavutkoy", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/atasehir.geojson", "binalar-atasehir", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/avcilar.geojson", "binalar-avcilar", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/bagcilar.geojson", "binalar-bagcilar", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/bahcelievler.geojson", "binalar-bahcelievler", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/bakirkoy.geojson", "binalar-bakirkoy", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/basaksehir.geojson", "binalar-basaksehir", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/bayrampasa.geojson", "binalar-bayrampasa", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/besiktas.geojson", "binalar-besiktas", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/beykoz.geojson", "binalar-beykoz", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/beylikduzu.geojson", "binalar-beylikduzu", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/beyoglu.geojson", "binalar-beyoglu", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/buyukcekmece.geojson", "binalar-buyukcekmece", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/cekmekoy.geojson", "binalar-cekmekoy", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/esenler.geojson", "binalar-esenler", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/esenyurt.geojson", "binalar-esenyurt", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/eyupsultan.geojson", "binalar-eyupsultan", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/fatih.geojson", "binalar-fatih", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/gaziosmanpasa.geojson", "binalar-gaziosmanpasa", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/gungoren.geojson", "binalar-gungoren", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/kadikoy.geojson", "binalar-kadikoy", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/kagithane.geojson", "binalar-kagithane", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/kartal.geojson", "binalar-kartal", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/kucukcekmece.geojson", "binalar-kucukcekmece", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/maltepe.geojson", "binalar-maltepe", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/pendik.geojson", "binalar-pendik", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/sancaktepe.geojson", "binalar-sancaktepe", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/sariyer.geojson", "binalar-sariyer", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/silivri.geojson", "binalar-silivri", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/sultanbeyli.geojson", "binalar-sultanbeyli", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/sultangazi.geojson", "binalar-sultangazi", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/sile.geojson", "binalar-sile", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/sisli.geojson", "binalar-sisli", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/tuzla.geojson", "binalar-tuzla", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/umraniye.geojson", "binalar-umraniye", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/uskudar.geojson", "binalar-uskudar", "fill", buildingColor, buildingOpacity, buildingMinZoom);
  addGeoJsonLayer("data/yapilar/zeytinburnu.geojson", "binalar-zeytinburnu", "fill", buildingColor, buildingOpacity, buildingMinZoom);


  // Yol Katmanları (Çizgi tipi)

  // Yerleşim Yeri Yolları
  const yerlesimyeriRenk = "#a1a198ff";
  const yyMinZoom = 11.5; //11.5
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

  // Sınır Çizgileri (Kesikli Çizgi tipi)
  const sinirRenk = "#555555ff";
  addGeoJsonLayer("data/sinirlar/ilceler.geojson", "sinir-ilce", "line", sinirRenk, "ilce-sinir", 9);

  // Üçüncül Yollar
  const ucunculRenk = "#bbc198ff";
  addGeoJsonLayer("data/yollar/ucuncul/ucunculyollar.geojson", "yol-ucuncul", "line", ucunculRenk, 1.5, 10);

  // İkincil Yollar
  const ikincilRenk = "#b7ae63ff";
  addGeoJsonLayer("data/yollar/ikincil/ikincilyollar.geojson", "yol-ikincil", "line", ikincilRenk, 2, 10);

  // Birincil Yollar
  const birincilRenk = "#c9922bff";
  addGeoJsonLayer("data/yollar/birincil/asya.geojson", "yol-asya", "line", birincilRenk, 2, 10);
  addGeoJsonLayer("data/yollar/birincil/avrupa.geojson", "yol-avrupa", "line", birincilRenk, 2, 10);

  // Otoyollar:
  addGeoJsonLayer("data/yollar/otoyol/otoyollar.geojson", "yol-otoyol", "line", "#c92b2b", 2, 9);
  addGeoJsonLayer("data/yollar/otoyol/dubleyollar.geojson", "yol-dubleyol", "line", "#c9552bff", 2, 9);
  addGeoJsonLayer("data/yollar/otoyol/otoyolbaglantilari.geojson", "yol-otoyolbaglantilari", "line", "#c92b2b", 2, 10.5);
  addGeoJsonLayer("data/yollar/otoyol/dubleyolbaglantilari.geojson", "yol-dubleyolbaglantilari", "line", "#c9552bff", 2, 10.5); //10.5


  // Yol Etiket Katmanları
  addRoadLabelLayer("yol-otoyol", "yol-otoyol-label", 9, 16);
  addRoadLabelLayer("yol-dubleyol", "yol-dubleyol-label", 9, 15);

  addRoadLabelLayer("yol-otoyolbaglantilari", "yol-otoyolbaglantilari-label", 11, 13);
  addRoadLabelLayer("yol-dubleyolbaglantilari", "yol-dubleyolbaglantilari-label", 11, 13);

  addRoadLabelLayer("yol-asya", "yol-asya-label", 11, 13);
  addRoadLabelLayer("yol-avrupa", "yol-avrupa-label", 11, 13);

  addRoadLabelLayer("yol-ikincil", "yol-ikincil-label", 12, 12);
  addRoadLabelLayer("yol-ucuncul", "yol-ucuncul-label", 13, 12);
  addRoadLabelLayer("yol-yerlesim-adalar", "yol-yerlesim-adalar-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-arnavutkoy", "yol-yerlesim-arnavutkoy-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-atasehir", "yol-yerlesim-atasehir-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-avcilar", "yol-yerlesim-avcilar-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-bagcilar", "yol-yerlesim-bagcilar-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-bahcelievler", "yol-yerlesim-bahcelievler-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-bakirkoy", "yol-yerlesim-bakirkoy-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-basaksehir", "yol-yerlesim-basaksehir-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-bayrampasa", "yol-yerlesim-bayrampasa-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-besiktas", "yol-yerlesim-besiktas-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-beykoz", "yol-yerlesim-beykoz-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-beylikduzu", "yol-yerlesim-beylikduzu-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-beyoglu", "yol-yerlesim-beyoglu-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-buyukcekmece", "yol-yerlesim-buyukcekmece-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-catalca", "yol-yerlesim-catalca-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-cekmekoy", "yol-yerlesim-cekmekoy-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-esenler", "yol-yerlesim-esenler-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-esenyurt", "yol-yerlesim-esenyurt-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-eyupsultan", "yol-yerlesim-eyupsultan-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-fatih", "yol-yerlesim-fatih-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-gaziosmanpasa", "yol-yerlesim-gaziosmanpasa-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-gungoren", "yol-yerlesim-gungoren-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-kadikoy", "yol-yerlesim-kadikoy-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-kagithane", "yol-yerlesim-kagithane-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-kartal", "yol-yerlesim-kartal-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-kucukcekmece", "yol-yerlesim-kucukcekmece-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-maltepe", "yol-yerlesim-maltepe-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-pendik", "yol-yerlesim-pendik-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-sancaktepe", "yol-yerlesim-sancaktepe-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-sariyer", "yol-yerlesim-sariyer-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-silivri", "yol-yerlesim-silivri-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-sultanbeyli", "yol-yerlesim-sultanbeyli-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-sultangazi", "yol-yerlesim-sultangazi-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-sile", "yol-yerlesim-sile-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-sisli", "yol-yerlesim-sisli-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-tuzla", "yol-yerlesim-tuzla-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-umraniye", "yol-yerlesim-umraniye-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-uskudar", "yol-yerlesim-uskudar-label", yyMinZoom, 10);
  addRoadLabelLayer("yol-yerlesim-zeytinburnu", "yol-yerlesim-zeytinburnu-label", yyMinZoom, 10);


  console.info("Tüm katmanlar başarıyla kuruldu.");

});
