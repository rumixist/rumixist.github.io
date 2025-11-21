// tuv-sozluk.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase bağlantısı
const supabaseUrl = 'https://jneuwkadlgoxekhcbvdh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZXV3a2FkbGdveGVraGNidmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjA1MjYsImV4cCI6MjA3MTE5NjUyNn0.KGuu4wkXhoY8B8JqDmO0mWhoC2Ep1EfXfIRHupzJ6Sw'
const supabase = createClient(supabaseUrl, supabaseKey)

// DOM elementleri
const input = document.getElementById('tuvSearchInput')
const suggestions = document.getElementById('tuvSuggestions')
const wordDetails = document.getElementById('tuvWordDetails')

let activeIndex = -1
let currentSuggestions = []

// Debounce fonksiyonu
function debounce(func, delay) {
    let timeout
    return function(...args) {
        clearTimeout(timeout)
        timeout = setTimeout(() => func.apply(this, args), delay)
    }
}

// Arama sorgusu
async function searchWords(query) {
    if (!query) return []
    const { data, error } = await supabase
        .from('kelimeler')
        .select('*')
        .ilike('kelime', `%${query}%`)
        .limit(6)
    if (error) {
        console.error(error)
        return []
    }
    return data
}

// Önerileri güncelle
async function updateSuggestions() {
    const query = input.value.trim()
    currentSuggestions = await searchWords(query)
    activeIndex = -1
    suggestions.innerHTML = currentSuggestions.map((r, i) =>
        `<li data-id="${r.id}" ${i===0 ? 'class="active"' : ''}>${r.kelime}</li>`
    ).join('')
}

// Highlight ve input update
function highlightSuggestion() {
    const items = suggestions.querySelectorAll('li')
    items.forEach((item, i) => item.classList.toggle('active', i === activeIndex))
    if (activeIndex >= 0) {
        input.value = currentSuggestions[activeIndex].kelime
    }
}

// Detay gösterme
async function showWordDetails(id) {
    const { data } = await supabase.from('kelimeler').select('*').eq('id', id).single()
    if (data) {
        wordDetails.innerHTML = `
            <h2>${data.kelime}</h2>
            <p><strong>Türkçeye</strong> <i>${data.kokeni}</i> <strong>dilinden geldi</strong></p> <br>
            <p style="font-size: 20px"><strong>Türkçe Seçenekleri:</strong> <i style="color: red">${data.turkce_alternatifleri}</i></p> <br>
            <p><strong>Açıklama:</strong> <i style="color: red">${data.aciklama}</i></p> <br> <br>
        `

        input.value = data.kelime
        suggestions.style.display = 'none'
        input.blur()

    } else {
        wordDetails.innerHTML = '<p>Aradığınız sözcük ya da söylem veritabanımızda yok</p>'
        suggestions.style.display = 'none'
        input.blur()
    }
}

// Event listenerler
input.addEventListener('input', debounce(updateSuggestions, 300))

input.addEventListener('keydown', (e) => {
    if (!currentSuggestions.length) return
    if (e.key === 'ArrowDown') {
        activeIndex = (activeIndex + 1) % currentSuggestions.length
        highlightSuggestion()
        e.preventDefault()
    } else if (e.key === 'ArrowUp') {
        activeIndex = (activeIndex - 1 + currentSuggestions.length) % currentSuggestions.length
        highlightSuggestion()
        e.preventDefault()
    } else if (e.key === 'Enter') {
        e.preventDefault()
        if (activeIndex >=0) {
            showWordDetails(currentSuggestions[activeIndex].id)
        } else {
            const exact = currentSuggestions.find(s => s.kelime.toLowerCase() === input.value.trim().toLowerCase())
            if (exact) {
                showWordDetails(exact.id)
            } else {
                wordDetails.innerHTML = '<p>Aradığınız sözcük ya da söylem veritabanımızda yok</p>'
            }
        }
    }
})

suggestions.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        const id = e.target.dataset.id
        showWordDetails(id)
    }
})

// Form submit
window.handleTuvSearch = function(e) {
    e.preventDefault()
    if (activeIndex >= 0) {
        showWordDetails(currentSuggestions[activeIndex].id)
    } else {
        const exact = currentSuggestions.find(s => s.kelime.toLowerCase() === input.value.trim().toLowerCase())
        if (exact) {
            showWordDetails(exact.id)
        } else {
            wordDetails.innerHTML = '<p>Aradığınız sözcük ya da söylem veritabanımızda yok</p>'
        }
    }
    return false
}

// Input focus
input.addEventListener('focus', () => {
    if (input.value.trim() && currentSuggestions.length) {
        suggestions.style.display = 'block'
    }
})

// Input değiştiğinde önerileri güncelle
input.addEventListener('input', debounce(async () => {
    await updateSuggestions()
    if (input.value.trim() && currentSuggestions.length) {
        suggestions.style.display = 'block'
    } else {
        suggestions.style.display = 'none'
    }
}, 300))

// Input blur
input.addEventListener('blur', () => {
    setTimeout(() => {
        suggestions.style.display = 'none'
    }, 200)
})


// İstatistikleri yükle

async function loadStatistics() {
    const { data, error } = await supabase.from('kelimeler').select('kokeni')
    if (error) {
        console.error('İstatistik hatası:', error)
        document.getElementById('statsSummary').innerText = 'Veriler alınamadı.'
        return
    }

    if (!data.length) {
        document.getElementById('statsSummary').innerText = 'Hiç kelime bulunamadı.'
        return
    }

    const total = data.length

    // Kökenleri say
    const counts = {}
    data.forEach(row => {
        const lang = row.kokeni?.trim() || 'Bilinmiyor'
        counts[lang] = (counts[lang] || 0) + 1
    })

    // Yüzdelik hesapla
    const entries = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([lang, count]) => ({
            lang,
            count,
            percent: ((count / total) * 100).toFixed(1)
        }))

    // Özet
    document.getElementById('statsSummary').innerHTML =
        `<p>Bu sözlükte <strong>${total}</strong> kelime var.</p>`

    // Grafik çubukları
    const bars = entries.map(e => `
        <div class="stat-item">
            <div class="stat-label">${e.lang} (${e.count} | ${e.percent}%)</div>
            <div class="stat-bar">
                <div class="stat-bar-fill" style="width:${e.percent}%"></div>
            </div>
        </div>
    `).join('')


    document.getElementById('statsBars').innerHTML = bars
}

// Sayfa yüklendiğinde çalıştır
window.addEventListener('DOMContentLoaded', loadStatistics)


// Günün kelimesi
async function showWordOfTheDay() {
    const wordContainer = document.querySelector('.word-of-the-day')
    if (!wordContainer) return

    const today = new Date().toISOString().split('T')[0]
    const saved = JSON.parse(localStorage.getItem('wordOfTheDay'))

    // Eğer bugün için zaten kaydedilmiş kelime varsa onu kullan
    if (saved && saved.date === today) {
        displayWord(saved.word)
        return
    }

    // Veritabanından tüm kelimeleri çek (örnek tablo adı: "kelimeler")
    const { data, error } = await supabase.from('kelimeler').select('*')

    if (error || !data || data.length === 0) {
        wordContainer.innerHTML = '<p>Kelime bulunamadı.</p>'
        return
    }

    // Rastgele kelime seç
    const randomWord = data[Math.floor(Math.random() * data.length)]

    // Ekranda göster
    displayWord(randomWord)

    // localStorage’a kaydet
    localStorage.setItem('wordOfTheDay', JSON.stringify({
        date: today,
        word: randomWord
    }))
}

function displayWord(word) {
    const container = document.querySelector('.word-of-the-day')
    container.querySelector('.word-title').textContent = word.kelime
    container.querySelector('.word-meaning').textContent = `Türkçesi: ${word.turkce_alternatifleri}` || 'Türkçe karşılığı şimdilik yok'
    container.querySelector('.word-origin').textContent = word.kokeni ? `Türkçeye ${word.kokeni} dilinden geldi` : ''
}

// Sayfa yüklendiğinde göster
document.addEventListener('DOMContentLoaded', showWordOfTheDay)

function showCurrentDate() {
    const tarihEl = document.getElementById('tarih')
    if (!tarihEl) return

    const tarih = new Date()

    // Türkçe biçimde tarih: 26 Ekim 2025, Pazar
    const gun = tarih.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
    })

    tarihEl.textContent = gun.charAt(0).toUpperCase() + gun.slice(1)
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', showCurrentDate)


