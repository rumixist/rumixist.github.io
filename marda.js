const PYTHONANYWHERE_API_BASE_URL = "http://rumixist.pythonanywhere.com"; // <-- BURAYI KENDİ ADRESİNİZLE DEĞİŞTİRİN

// API endpointleri
const API_ENDPOINTS = {
    rate: `${PYTHONANYWHERE_API_BASE_URL}/api/rate`,
    clustering: `${PYTHONANYWHERE_API_BASE_URL}/api/clustering`,
    magnitude: `${PYTHONANYWHERE_API_BASE_URL}/api/magnitude`,
    bvalue: `${PYTHONANYWHERE_API_BASE_URL}/api/bvalue`,
    latest: `${PYTHONANYWHERE_API_BASE_URL}/api/latest_earthquake_time` // Son deprem zamanı için yeni endpoint (Python'da oluşturulacak)
};

// HTML elementlerini seçmek için yardımcı fonksiyon
const getElement = (id) => document.getElementById(id);

// Son güncelleme tarihini gösterme fonksiyonu
const displayLastUpdated = (timestamp) => {
    const timestampElement = getElement('last-updated-timestamp');
    if (timestampElement) {
        if (timestamp) {
            try {
                // Supabase'den gelen ISO 8601 formatını Date objesine çevir
                const date = new Date(timestamp);
                // Türkiye yerel formatına çevir
                const formattedDate = date.toLocaleString('tr-TR', {
                    year: 'numeric',
                    month: 'long', // Ayın tam adını göster
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                timestampElement.textContent = `Son Güncelleme: ${formattedDate}`;
            } catch (e) {
                console.error("Tarih formatlama hatası:", e);
                 timestampElement.textContent = `Son Güncelleme: Bilinmiyor (Tarih hatası)`;
            }
        } else {
            timestampElement.textContent = `Son Güncelleme: Veri alınamadı`;
        }
    }
};

// Analiz sonuçlarını HTML'e render eden fonksiyonlar
const renderRateAnalysis = (data, elementId) => {
    const analysisContentDiv = getElement(elementId).querySelector('.analysis-content');
    let html = '';

    if (data && Object.keys(data).length > 0) { // Data doluysa render et
        // Son güncelleme zamanı varsa burada da işlenebilir veya ayrı çağrı kullanılabilir.
        // Ayrı çağrı daha temiz olacak.

        html += '<h3>Deprem Sayıları (Son Dönemler)</h3>';
        html += `<ul>`;
        // Object.entries kullanarak sırayı korumak daha iyi olabilir
        Object.entries(data.period_counts || {}).forEach(([periodKey, count]) => {
             const periodLabel = periodKey.replace('_hours', ' Saat').replace('_days', ' Gün'); // Türkçe etiketler
             html += `<li><strong>Son ${periodLabel}:</strong> ${count} deprem</li>`;
        });
        html += `</ul>`;

        html += '<h3>Uzun Vadeli Ortalamalar (Son 30 Gün)</h3>';
        html += `<ul>`;
         Object.entries(data.long_term_averages || {}).forEach(([key, value]) => {
             const label = key.replace('daily_', 'Günlük ').replace('hourly_', 'Saatlik ').replace('30_days', ' (30 Gün)'); // Türkçe etiketler
             html += `<li><strong>${label.charAt(0).toUpperCase() + label.slice(1)} Ortalama:</strong> ${value !== undefined ? value.toFixed(2) : 'N/A'} deprem</li>`;
         });
        html += `</ul>`;

        if (data.rate_ratios && Object.keys(data.rate_ratios).length > 0) {
             html += '<h3>Hız Oranları (30 Günlük Ortalamaya Göre)</h3>';
             html += `<ul>`;
             Object.entries(data.rate_ratios).forEach(([ratioKey, ratioValue]) => {
                 const periodLabel = ratioKey.split('_vs_')[0].replace('_hours', ' Saat').replace('_days', ' Gün'); // Türkçe etiketler
                 html += `<li><strong>Son ${periodLabel}:</strong> ${ratioValue !== undefined ? ratioValue.toFixed(2) : 'N/A'} katı</li>`;
             });
             html += `</ul>`;
        }


        html += '<h3>İstatistiksel Anomali Göstergesi (Son 24 Saat)</h3>';
        html += `<ul>`;
         if (data.statistical_anomaly) {
             html += `<li><strong>Ortalama Günlük (30 gün):</strong> ${data.statistical_anomaly.mean_daily_30_days !== undefined ? data.statistical_anomaly.mean_daily_30_days.toFixed(2) : 'N/A'}</li>`;
             html += `<li><strong>Standart Sapma (30 gün):</strong> ${data.statistical_anomaly.stdev_daily_30_days !== undefined ? data.statistical_anomaly.stdev_daily_30_days.toFixed(2) : 'N/A'}</li>`;
             if (data.statistical_anomaly['24_hour_z_score'] !== null && data.statistical_anomaly['24_hour_z_score'] !== undefined) {
                  html += `<li><strong>Son 24 Saat Z-Skoru:</strong> ${data.statistical_anomaly['24_hour_z_score'].toFixed(2)}</li>`;
             } else {
                  html += `<li><strong>Son 24 Saat Z-Skoru:</strong> Hesaplamadı (Yeterli veri yok/varyasyon düşük)</li>`;
             }
             html += `<li><strong>Yorum:</strong> ${data.statistical_anomaly.comment || 'N/A'}</li>`;
         } else {
              html += '<li>İstatistiksel anomali verisi bulunamadı.</li>';
         }
        html += `</ul>`;


        if (data.comment) {
             html += `<p><strong>Genel Yorum:</strong> ${data.comment}</p>`;
        }


    } else {
        html = '<p>Analiz verisi bulunamadı veya boş döndü.</p>';
    }

    analysisContentDiv.innerHTML = html;
};

const renderClusteringAnalysis = (data, elementId) => {
    const analysisContentDiv = getElement(elementId).querySelector('.analysis-content');
    let html = '';

    if (data && data.clusters && data.clusters.length > 0) {
        html += `<p>Toplam ${data.total_clusters_found} adet mekansal küme tespit edildi (Son ${data.clustering_parameters.time_window_hours} saat, Eşik: ${data.clustering_parameters.distance_threshold_km} km, Min Boyut: ${data.clustering_parameters.min_cluster_size}).</p>`;
        html += '<ul>';
        data.clusters.forEach((cluster, index) => {
            html += `<li>`;
            html += `<strong>Küme #${index + 1} (${cluster.size} Deprem)</strong>`;
            html += `<p>Ortalama Konum: Enlem ${cluster.average_location.latitude.toFixed(4)}, Boylam ${cluster.average_location.longitude.toFixed(4)}</p>`;
            if (cluster.max_magnitude_earthquake) {
                const maxEq = cluster.max_magnitude_earthquake;
                // Tarih formatını daha okunur hale getirebilirsiniz
                const date = new Date(maxEq.date);
                 const formattedDate = isNaN(date.getTime()) ? maxEq.date : date.toLocaleString('tr-TR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

                html += `<p>En Büyük Deprem: Tarih ${formattedDate}, Büyüklük ${maxEq.magnitude.toFixed(1)}, Derinlik ${maxEq.depth_km} km${maxEq.location_text ? ', Yer: ' + maxEq.location_text : ''}</p>`;
            } else {
                html += `<p>Kümedeki en büyük deprem bilgisi yok.</p>`;
            }
            // Eğer cluster objesine depremler listesini eklediyseniz burada döngüye alıp gösterebilirsiniz
            // if (cluster.earthquakes) { ... }
            html += `</li>`;
        });
        html += '</ul>';
    } else if (data && data.comment) {
        html = `<p>${data.comment}</p>`; // Python'dan gelen Türkçe yorumu göster
    }
    else {
        html = '<p>Analiz verisi bulunamadı veya hiç küme tespit edilmedi.</p>';
    }

    analysisContentDiv.innerHTML = html;
};


const renderMagnitudeAnalysis = (data, elementId) => {
    const analysisContentDiv = getElement(elementId).querySelector('.analysis-content');
    let html = '';

    if (data && data.counts_by_period_and_magnitude) {
        html += '<h3>Deprem Sayıları (Büyüklük Eşiklerine Göre)</h3>';

        // Object.entries kullanarak sırayı korumak daha iyi olabilir (Python'daki sıralama korunur)
        Object.entries(data.counts_by_period_and_magnitude).forEach(([periodKey, counts]) => {
             const periodLabel = periodKey.replace('_hours', ' Saat').replace('_days', ' Gün'); // Türkçe etiketler
             html += `<h4>Son ${periodLabel}</h4>`;
             html += `<ul>`;
             Object.entries(counts).forEach(([thresholdKey, count]) => {
                  const magnitudeLabel = thresholdKey.replace('geq_', '≥ '); // Türkçe etiket
                  html += `<li><strong>${magnitudeLabel}:</strong> ${count} deprem</li>`;
             });
             html += `</ul>`;
        });


        if (data.comment) {
             html += `<p><strong>Yorum:</strong> ${data.comment}</p>`; // Python'dan gelen Türkçe yorumu göster
        }


    } else {
        html = '<p>Analiz verisi bulunamadı veya boş döndü.</p>';
    }

    analysisContentDiv.innerHTML = html;
};


const renderBValueAnalysis = (data, elementId) => {
    const analysisContentDiv = getElement(elementId).querySelector('.analysis-content');
    let html = '';

    if (data && data.b_values_by_period) {
        html += '<h3>B-Değeri Hesaplamaları</h3>';
        html += '<ul>';
         // Object.entries kullanarak sırayı korumak daha iyi olabilir (Python'daki sıralama korunur)
         Object.entries(data.b_values_by_period).forEach(([periodKey, bValueData]) => {
             const periodLabel = periodKey.replace('_days', ' Gün'); // Türkçe etiket
             let line = `<li><strong>Son ${periodLabel}:</strong> `;
             if (bValueData.b_value !== null) {
                  line += `b-değeri: ${bValueData.b_value !== undefined ? bValueData.b_value.toFixed(2) : 'N/A'}, Mc: ${bValueData.mc !== undefined ? bValueData.mc.toFixed(2) : 'N/A'}, Deprem Sayısı: ${bValueData.earthquake_count !== undefined ? bValueData.earthquake_count : 'N/A'}`;
             } else {
                  line += `${bValueData.status || 'Hesaplanamadı'} (Deprem Sayısı: ${bValueData.earthquake_count !== undefined ? bValueData.earthquake_count : 'N/A'})`;
             }
             line += `</li>`;
             html += line;
         });
        html += `</ul>`;

        if (data.percentage_change_7d_vs_30d !== null && data.percentage_change_7d_vs_30d !== undefined) {
             html += `<p><strong>% Değişim (7 Gün vs 30 Gün):</strong> ${data.percentage_change_7d_vs_30d.toFixed(2)} %</p>`;
        }

        if (data.comment) {
             html += `<p><strong>Yorum:</strong> ${data.comment}</p>`; // Python'dan gelen Türkçe yorumu göster
        }


    } else {
        html = '<p>Analiz verisi bulunamadı veya boş döndü.</p>';
    }

    analysisContentDiv.innerHTML = html;
};


// API'den veri çekme ve işleme için ana fonksiyon
const fetchAnalysis = async (endpointUrl, elementId, renderFunction) => {
    const section = getElement(elementId);
    // Elementler bulunamazsa hata vermemek için kontrol
    if (!section) {
        console.error(`HTML elementi bulunamadı: #${elementId}`);
        return;
    }
    const loading = section.querySelector('.loading');
    const errorElement = section.querySelector('.error');
    const contentDiv = section.querySelector('.analysis-content');

     // Yükleniyor ve hata elementleri bulunamazsa devam et
    if (!loading || !errorElement || !contentDiv) {
         console.error(`Analiz bölümü içindeki elementler bulunamadı: #${elementId}`);
         return;
    }


    // Önceki içeriği ve hata mesajını temizle, yükleniyor göster
    contentDiv.innerHTML = '';
    errorElement.style.display = 'none';
    loading.style.display = 'block';


    try {
        const response = await fetch(endpointUrl);

        if (!response.ok) {
            // HTTP hata kodu (404, 500 vb.)
            const errorText = await response.text(); // Hata detayını almaya çalış
            throw new Error(`HTTP hatası! Durum: ${response.status}, Detay: ${errorText}`); // Türkçe hata mesajı
        }

        const data = await response.json();

        // Yükleniyor mesajını gizle
        loading.style.display = 'none';

        // Render fonksiyonunu çağır
        renderFunction(data, elementId);

    } catch (error) {
        // Network hatası veya JSON parse hatası
        console.error(`API'den veri çekilirken hata oluştu (${endpointUrl}):`, error);

        // Yükleniyor mesajını gizle ve hata mesajını göster
        loading.style.display = 'none';
        errorElement.textContent = `Veri çekme hatası: ${error.message}`; // Türkçe hata mesajı
        errorElement.style.display = 'block';

        // İçerik alanını temizle veya hata mesajı göster
        contentDiv.innerHTML = '<p>Analiz sonuçları yüklenemedi.</p>'; // Türkçe mesaj
    }
};

// Son güncelleme tarihini çeken fonksiyon
const fetchLastUpdatedTimestamp = async () => {
    const timestampElement = getElement('last-updated-timestamp');
     if (!timestampElement) {
        console.error("Son güncelleme tarihi elementi bulunamadı.");
        return;
     }

    timestampElement.textContent = "Son Güncelleme: Yükleniyor..."; // Türkçe yükleniyor mesajı

    try {
        const response = await fetch(API_ENDPOINTS.latest);

        if (!response.ok) {
             const errorText = await response.text();
             throw new Error(`HTTP hatası! Durum: ${response.status}, Detay: ${errorText}`); // Türkçe hata
        }

        const data = await response.json();

        if (data && data.latest_earthquake_time) {
            displayLastUpdated(data.latest_earthquake_time);
        } else {
            displayLastUpdated(null); // Veri yoksa null gönder
             console.warn("API'den son deprem zamanı verisi alınamadı veya boş döndü.");
        }

    } catch (error) {
        console.error("Son güncelleme tarihi çekilirken hata oluştu:", error);
        timestampElement.textContent = `Son Güncelleme: Hata (${error.message})`; // Türkçe hata
    }
};


// Sayfa yüklendiğinde analizleri ve son güncelleme tarihini çek
document.addEventListener('DOMContentLoaded', () => {
    // API adresinin güncellenip güncellenmediğini kontrol et
    if (PYTHONANYWHERE_API_BASE_URL === "http://placeholder.pythonanywhere.com" || PYTHONANYWHERE_API_BASE_URL.includes("[kullaniciadiniz]")) {
        // alert("Lütfen script.js dosyasındaki PYTHONANYWHERE_API_BASE_URL değişkenini kendi adresinizle güncelleyin!"); // Pop-up yerine konsola yazabilir
        console.error("API adresi güncellenmemiş! Lütfen marda.js dosyasını kontrol edin.");
        // Hata mesajlarını gösterelim ilgili bölümlerde
        document.querySelectorAll('.analysis-section').forEach(section => {
             const loadingElement = section.querySelector('.loading');
             if(loadingElement) loadingElement.style.display = 'none';

             const errorElement = section.querySelector('.error');
             if(errorElement) {
                 errorElement.textContent = "API adresi ayarlanmamış. Lütfen marda.js dosyasını güncelleyin."; // Türkçe hata mesajı
                 errorElement.style.display = 'block';
             }
        });
         const timestampElement = getElement('last-updated-timestamp');
         if(timestampElement) {
            timestampElement.textContent = "Son Güncelleme: API adresi ayarlanmamış."; // Türkçe hata mesajı
         }
        return; // Adres güncellenmemişse devam etme
    }

    // API'den verileri çek ve ilgili bölümlere yerleştir
    fetchAnalysis(API_ENDPOINTS.rate, 'rate-analysis', renderRateAnalysis);
    fetchAnalysis(API_ENDPOINTS.clustering, 'clustering-analysis', renderClusteringAnalysis);
    fetchAnalysis(API_ENDPOINTS.magnitude, 'magnitude-analysis', renderMagnitudeAnalysis);
    fetchAnalysis(API_ENDPOINTS.bvalue, 'bvalue-analysis', renderBValueAnalysis);

    // Son güncelleme tarihini çek
    fetchLastUpdatedTimestamp();
});