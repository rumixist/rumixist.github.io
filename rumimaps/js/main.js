// ======================
// main.js - Rumimaps JS
// ======================

// ----------------------
// HARİTA OLUŞTURMA
// ----------------------
const map = L.map('map', {
    center: [39.925, 32.866],
    zoom: 6,
    zoomControl: false
});

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> | © OSM',
    maxZoom: 20
}).addTo(map);

// ----------------------
// PANEL & DOM KISIMLARI
// ----------------------

// POI panel (fallback: poi-details element if panel not present)
const poiPanel = document.getElementById('poi-panel');      // optional panel container
const poiContent = document.getElementById('poi-content') || document.getElementById('poi-details');
const closePoiBtn = document.getElementById('close-poi');

// Bus panel
const busPanel = document.getElementById('bus-panel');
const busContent = document.getElementById('bus-content') || document.getElementById('poi-details');
const closeBusBtn = document.getElementById('close-bus');

// Utility to safely show/hide panels (works if element exists)
function showElement(el) { if (!el) return; el.style.display = 'block'; }
function hideElement(el) { if (!el) return; el.style.display = 'none'; }

// Ensure fallback: if neither poiContent nor busContent exist, create minimal fallback
if (!poiContent) {
    console.warn('poi-content and poi-details not found — creating fallback');
    const fallback = document.createElement('div');
    fallback.id = 'poi-details';
    fallback.style.position = 'absolute';
    fallback.style.top = '140px';
    fallback.style.left = '20px';
    fallback.style.background = 'rgba(255,255,255,0.95)';
    fallback.style.padding = '10px';
    fallback.style.zIndex = 1200;
    fallback.style.maxHeight = '60%';
    fallback.style.overflowY = 'auto';
    document.body.appendChild(fallback);
}

// Close buttons behavior
if (closePoiBtn) {
    closePoiBtn.addEventListener('click', () => {
        hideElement(poiPanel);
    });
}
if (closeBusBtn) {
    closeBusBtn.addEventListener('click', () => {
        hideElement(busPanel);
        clearRoute(); // remove drawn route & stops
    });
}

// ----------------------
// POI SİSTEMİ
// ----------------------
const poiLayer = L.layerGroup().addTo(map);
const MAX_POI = 80;
const ZOOM_THRESHOLD = 15;

function approxDist(lat1, lon1, lat2, lon2) {
    // small-area approximate distance (squared isn't necessary here)
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
}

const pharmacyIcon = L.icon({
    iconUrl: '/rumimaps/assets/pharmacy.png',
    iconSize: [16,16],
    iconAnchor: [8,16],
    popupAnchor: [0,-16]
});
const restaurantIcon = L.icon({
    iconUrl: '/rumimaps/assets/restaurant.png',
    iconSize: [16,16],
    iconAnchor: [8,16],
    popupAnchor: [0,-16]
});
const defaultIcon = L.icon({
    iconUrl: '/rumimaps/assets/default.png',
    iconSize: [12,12],
    iconAnchor: [6,12],
    popupAnchor: [0,-12]
});

function showPOIPanelHTML(html) {
    // prefer poiContent (separate panel) if exists, else poi-details fallback
    const target = document.getElementById('poi-content') || document.getElementById('poi-details');
    if (target) {
        target.innerHTML = html;
        // open panel if exists
        if (poiPanel) showElement(poiPanel);
    } else {
        console.warn('No POI content container found.');
    }
}

function drawPOIs(pois) {
    poiLayer.clearLayers();
    if (!Array.isArray(pois)) return;

    const center = map.getCenter();
    const sorted = pois
        .filter(p => p && p.lat && p.lon)
        .sort((a,b) => approxDist(a.lat,a.lon,center.lat,center.lng) - approxDist(b.lat,b.lon,center.lat,center.lng))
        .slice(0, MAX_POI);

    sorted.forEach(poi => {
        let icon = defaultIcon;
        if (poi.tags) {
            if (poi.tags.amenity === 'pharmacy') icon = pharmacyIcon;
            else if (poi.tags.amenity === 'restaurant' || poi.tags.cuisine) icon = restaurantIcon;
        }

        const marker = L.marker([poi.lat, poi.lon], { icon }).addTo(poiLayer);

        marker.on('click', () => {
            // Only update POI panel — do not touch bus panel
            const name = poi.tags?.name || 'İsimsiz POI';
            const type = poi.tags?.amenity || poi.tags?.shop || 'bilinmiyor';
            const html = `<b>${escapeHtml(name)}</b><br>Tür: ${escapeHtml(type)}<br>ID: ${poi.id || ''}`;
            showPOIPanelHTML(html);
        });
    });
}

function fetchOSMPOIs() {
    if (map.getZoom() < ZOOM_THRESHOLD) {
        poiLayer.clearLayers();
        return;
    }
    const b = map.getBounds();
    const query = `[out:json][timeout:25];
      (
        node["amenity"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()});
      );
      out body;`;
    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data || !data.elements) return;
            drawPOIs(data.elements);
        })
        .catch(err => console.error('Overpass POI error', err));
}

map.on('moveend', fetchOSMPOIs);
map.on('zoomend', fetchOSMPOIs);

// ----------------------
// OTOBÜS HATTI SİSTEMİ
// ----------------------

let currentRouteLayers = [];  // polylines + arrows
let currentStopMarkers = [];  // circle markers for stops

function clearRoute() {
    currentRouteLayers.forEach(l => { try { map.removeLayer(l); } catch(e){} });
    currentStopMarkers.forEach(m => { try { map.removeLayer(m); } catch(e){} });
    currentRouteLayers = [];
    currentStopMarkers = [];
    // hide bus panel if present
    if (busPanel) hideElement(busPanel);
}

// helper: escape html for safety
function escapeHtml(s) {
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Draw bus route from Overpass relation ref (dynamic, single hat)
function drawBusRouteOSM(routeRef) {
    if (!routeRef) return;
    // normalize
    routeRef = String(routeRef).trim();

    const query = `[out:json][timeout:60];
area["name"="İstanbul"]->.a;
relation["route"="bus"]["ref"="${routeRef}"](area.a);
out body;
>;
out geom;`;

    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data || !Array.isArray(data.elements) || data.elements.length === 0) {
                alert('Hat bulunamadı (OSM üzerinde relation yok).');
                return;
            }

            clearRoute();

            // Find relation element
            const relation = data.elements.find(e => e.type === 'relation' && e.tags && e.tags.ref);
            if (!relation) {
                alert('Relation bulunamadı.');
                return;
            }

            // Build quick lookup for elements by id (ways & nodes)
            const byId = new Map();
            data.elements.forEach(e => byId.set(e.id, e));

            // Collect stops (nodes) in relation order
            const stops = relation.members
                .filter(m => m.type === 'node')
                .map(m => {
                    const node = byId.get(m.ref);
                    return node ? { role: m.role || '', node } : null;
                })
                .filter(Boolean); // only existing nodes

            // Build direction lists
            let dirA = stops.filter(s => s.role === 'forward').map(s => s.node);
            let dirB = stops.filter(s => s.role === 'backward').map(s => s.node);

            // If no explicit forward/backward roles, use appearance order
            if (dirA.length === 0 && dirB.length === 0) {
                dirA = stops.map(s => s.node);
                dirB = dirA.slice().reverse();
            } else {
                // If one of them empty, create reverse of other
                if (dirA.length === 0 && dirB.length > 0) dirA = dirB.slice().reverse();
                if (dirB.length === 0 && dirA.length > 0) dirB = dirA.slice().reverse();
            }

            // Draw ways: for each way member draw its geometry as separate polyline
            // This avoids connecting end-to-start incorrectly
            relation.members
                .filter(m => m.type === 'way')
                .forEach(m => {
                    const way = byId.get(m.ref);
                    if (!way || !way.geometry) return;
                    const coords = way.geometry.map(p => [p.lat, p.lon]);
                    const line = L.polyline(coords, {
                        color: m.role === 'forward' ? '#d9534f' : (m.role === 'backward' ? '#0275d8' : '#ff7f0e'),
                        weight: 4,
                        opacity: 0.9
                    }).addTo(map);
                    currentRouteLayers.push(line);

                    // add simple direction arrow marker at midpoint (if arrow asset exists)
                    try {
                        const mid = coords[Math.floor(coords.length / 2)];
                        const arrowIcon = L.icon({
                            iconUrl: '/rumimaps/assets/arrow.png',
                            iconSize: [0,0],
                            iconAnchor: [7,7]
                        });
                        const arrow = L.marker(mid, { icon: arrowIcon, interactive: false }).addTo(map);
                        currentRouteLayers.push(arrow);
                    } catch (e) {
                        // ignore if asset missing
                    }
                });

            // Draw stops as circle markers, and collect stop names for panel
            const stopNamesA = dirA.map(n => n.tags?.name || 'İsimsiz durak');
            const stopNamesB = dirB.map(n => n.tags?.name || 'İsimsiz durak');

            // places markers
            dirA.forEach(n => {
                const m = L.circleMarker([n.lat, n.lon], {
                    radius: 5,
                    color: '#0044ff',
                    weight: 2,
                    fillColor: '#fff',
                    fillOpacity: 1
                }).addTo(map);
                m.bindPopup(`<b>${escapeHtml(n.tags?.name || 'Durak')}</b>`);
                currentStopMarkers.push(m);
            });

            // If dirB has different nodes not already drawn, draw them too (avoid duplicates)
            dirB.forEach(n => {
                const already = dirA.find(x => x.id === n.id);
                if (already) return;
                const m = L.circleMarker([n.lat, n.lon], {
                    radius: 5,
                    color: '#0044ff',
                    weight: 2,
                    fillColor: '#fff',
                    fillOpacity: 1
                }).addTo(map);
                m.bindPopup(`<b>${escapeHtml(n.tags?.name || 'Durak')}</b>`);
                currentStopMarkers.push(m);
            });

            // Fly to first available point
            const flyToPoint = (dirA.length ? dirA[0] : (dirB.length ? dirB[0] : null));
            if (flyToPoint) {
                map.flyTo([flyToPoint.lat, flyToPoint.lon], 13, { animate:true, duration: 2 });
            }

            // Show bus panel with buttons and lists
            showBusPanelForRoute(routeRef, stopNamesA, stopNamesB, dirA, dirB);
        })
        .catch(err => {
            console.error('Overpass route error', err);
            alert('Güzergah alınırken hata oluştu.');
        });
}

// Build and show bus panel content, wire buttons and list interactions
function showBusPanelForRoute(routeRef, stopNamesA, stopNamesB, nodesA, nodesB) {
    const target = busContent || document.getElementById('poi-details');
    if (!target) return;

    // Build HTML
    target.innerHTML = `
        <h3>${escapeHtml(routeRef)} hattı</h3>
        <div style="display:flex;gap:6px;margin:8px 0;">
            <button id="dirA" class="dir-btn">Yön A</button>
            <button id="dirB" class="dir-btn">Yön B</button>
        </div>
        <div id="stop-list" style="max-height:300px;overflow-y:auto;"></div>
    `;

    // Open panel if exists
    if (busPanel) showElement(busPanel);

    const listDiv = document.getElementById('stop-list');
    const btnA = document.getElementById('dirA');
    const btnB = document.getElementById('dirB');

    function renderList(names, nodes) {
        if (!Array.isArray(names)) {
            listDiv.innerHTML = '<div>Durak bilgisi yok.</div>';
            return;
        }
        listDiv.innerHTML = names.map((nm, idx) => {
            return `<div class="stop-item" data-idx="${idx}" style="padding:6px;border-bottom:1px solid #eee;cursor:pointer;">${escapeHtml(nm)}</div>`;
        }).join('');

        // attach click handlers to fly to stops
        listDiv.querySelectorAll('.stop-item').forEach(el => {
            el.onclick = () => {
                const idx = Number(el.dataset.idx);
                const node = nodes[idx];
                if (!node) return;
                map.flyTo([node.lat, node.lon], 16, { animate:true, duration: 1.2 });
            };
        });
    }

    btnA.onclick = () => {
        renderList(stopNamesA, nodesA);
        btnA.classList.add('active'); btnB.classList.remove('active');
    };
    btnB.onclick = () => {
        renderList(stopNamesB, nodesB);
        btnB.classList.add('active'); btnA.classList.remove('active');
    };

    // default show A
    btnA.click();
}

// ----------------------
// ARAMA SİSTEMİ
// ----------------------
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

function performSearch() {
    const raw = (searchInput && searchInput.value) ? searchInput.value.trim() : '';
    if (!raw) return;
    const query = raw.toUpperCase();

    // if bus hatı pattern like 136B or 15 or 500T etc.
    if (/^[0-9]+[A-Z0-9\-\/]*$/.test(query)) {
        // treat as bus route ref — fetch from OSM
        drawBusRouteOSM(query);
        return;
    }

    // else nominatim place search
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(raw)}&countrycodes=TR`;
    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                alert('Yer bulunamadı.');
                return;
            }
            const place = data[0];
            map.flyTo([parseFloat(place.lat), parseFloat(place.lon)], 16, { animate:true, duration: 1.5 });
            // show poi panel with place info (does not affect bus panel)
            showPOIPanelHTML(`<b>${escapeHtml(place.display_name)}</b>`);
        })
        .catch(err => {
            console.error('Nominatim error', err);
            alert('Arama yapılamadı.');
        });
}

// wire events (single attachments)
if (searchBtn) searchBtn.addEventListener('click', performSearch);
if (searchInput) searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') performSearch(); });

// ----------------------
// STYLES FOR ACTIVE BUTTON (optional simple runtime style injection)
// ----------------------
(function injectStyles(){
    const css = `
    .dir-btn { padding:6px 10px; border-radius:4px; border:1px solid #ccc; background:#f5f5f5; cursor:pointer; }
    .dir-btn.active { background:#007bff; color:#fff; border-color:#0062cc; }
    .stop-item:hover { background:#f0f8ff; }
    `;
    const s = document.createElement('style'); s.innerHTML = css; document.head.appendChild(s);
})();



let transitLayer = L.layerGroup().addTo(map);
let transitActive = false;

const transitBtn = document.getElementById('transit-btn');

transitBtn.addEventListener('click', () => {
    transitActive = !transitActive;
    transitBtn.classList.toggle('active', transitActive);

    if (transitActive) {
        fetchTransitLines(); // yalnızca düğme açıldığında çek
    } else {
        transitLayer.clearLayers(); // kapatınca temizle
    }
});

function fetchTransitLines() {
    if (!transitActive) return; 

    // Düzeltme: Eğer yakınlık 10'dan az ise (çok uzaksa)
    // var olan çizgileri sil ve yeni veri çekme
    if (map.getZoom() < 8) {
        transitLayer.clearLayers();
        return;
    }

    const bounds = map.getBounds();
    const minLat = bounds.getSouth() - 0.3;
    const minLon = bounds.getWest() - 0.3;
    const maxLat = bounds.getNorth() + 0.3;
    const maxLon = bounds.getEast() + 0.3;

    const query = `[out:json][timeout:25];
    (
      way["railway"="subway"](${minLat},${minLon},${maxLat},${maxLon});
    );
    out geom;`;

    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

    fetch(url)
        .then(res => res.json())
        .then(data => {
            // Her seferinde üst üste binmemesi için önce eskileri temizle
            transitLayer.clearLayers();

            data.elements.forEach(way => {
                if (!way.geometry) return;
                const coords = way.geometry.map(p => [p.lat, p.lon]);
                // Renk: Açık mavi (#00ddffff)
                L.polyline(coords, { color: '#00ddffff', weight: 3, opacity: 0.8 }).addTo(transitLayer);
            });
        })
        .catch(err => console.error(err));
}

// Harita hareketinde aktifse yeniden çekmek yerine sadece bilgi güncelle
// Böylece kaybolmaz ve sürekli Overpass çağrısı yapılmaz
map.on('moveend', () => {
    if (transitActive) fetchTransitLines();
});
map.on('zoomend', () => {
    if (transitActive) fetchTransitLines();
});



// ----------------------
// ÖLÇÜM ARACI SİSTEMİ
// ----------------------

// Değişkenler
let measureActive = false;
let measurePoints = [];
let measureLayer = L.layerGroup().addTo(map);
let totalDistance = 0;

// HTML öğelerini seçelim
const measureBtn = document.querySelector('button[title="Ölçüm"]'); // Senin butonun
const measurePanel = document.getElementById('measure-panel');
const measureDistEl = document.getElementById('measure-dist');
const closeMeasureBtn = document.getElementById('close-measure');
const resetMeasureBtn = document.getElementById('reset-measure');

// Ölçüm düğmesine basınca
measureBtn.addEventListener('click', () => {
    measureActive = !measureActive;
    
    if (measureActive) {
        measurePanel.style.display = 'block';
        measureBtn.classList.add('active');
        map.getContainer().style.cursor = 'crosshair'; // İmleci değiştir
    } else {
        kapatOlcum();
    }
});

// Paneli kapatma düğmesi
closeMeasureBtn.addEventListener('click', () => {
    measureActive = false;
    kapatOlcum();
});

// Temizle düğmesi
resetMeasureBtn.addEventListener('click', () => {
    sifirlaOlcum();
});

// Ölçümü kapatan ve temizleyen işlev
function kapatOlcum() {
    measurePanel.style.display = 'none';
    measureBtn.classList.remove('active');
    map.getContainer().style.cursor = '';
    sifirlaOlcum();
}

// Çizgileri ve verileri sıfırlayan işlev
function sifirlaOlcum() {
    measurePoints = [];
    totalDistance = 0;
    measureLayer.clearLayers();
    measureDistEl.innerText = '0 metre';
}

// Haritaya tıklayınca nokta ekleyen olay
map.on('click', (e) => {
    if (!measureActive) return;

    const latlng = e.latlng;
    
    // Nokta ekle (Daire şeklinde)
    L.circleMarker(latlng, { color: 'red', radius: 5 }).addTo(measureLayer);

    measurePoints.push(latlng);

    // Eğer birden fazla nokta varsa çizgi çek ve hesapla
    if (measurePoints.length > 1) {
        const lastPoint = measurePoints[measurePoints.length - 2];
        const newPoint = measurePoints[measurePoints.length - 1];

        // İki nokta arasına çizgi çek
        L.polyline([lastPoint, newPoint], { color: 'red', weight: 3, dashArray: '5, 10' }).addTo(measureLayer);

        // Uzaklığı hesapla (Leaflet'in kendi aracı ile)
        const dist = map.distance(lastPoint, newPoint);
        totalDistance += dist;

        // Sonucu yazdır
        gosterUzunluk(totalDistance);
    }
});

// Uzunluğu okunaklı biçimde yazan işlev
function gosterUzunluk(meters) {
    let text = '';
    if (meters > 1000) {
        text = (meters / 1000).toFixed(2) + ' km';
    } else {
        text = Math.round(meters) + ' metre';
    }
    measureDistEl.innerText = text;
}