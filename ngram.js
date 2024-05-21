// N-gram modelini tutacak obje
let ngramMap = {};

// ngram_data.txt dosyasını yükler ve ngramMap'i doldurur
async function loadNGrams() {
    const response = await fetch('ngram_data.txt');
    const data = await response.text();
    const lines = data.split('\n');

    for (const line of lines) {
        const parts = line.trim().split(' ');
        if (parts.length < 3) continue;

        const word1 = parts[0];
        const word2 = parts[1];
        const key = `${word1} ${word2}`;
        ngramMap[key] = ngramMap[key] || {};

        for (let i = 2; i < parts.length; i += 2) {
            const nextWord = parts[i];
            const count = parseInt(parts[i + 1], 10);
            ngramMap[key][nextWord] = (ngramMap[key][nextWord] || 0) + count;
        }
    }
}

// Verilen ağırlıklara göre rastgele bir kelime seçer
function getRandomNextWord(nextWords) {
    const totalWeight = Object.values(nextWords).reduce((acc, val) => acc + val, 0);
    const randomWeight = Math.floor(Math.random() * totalWeight);

    let runningTotal = 0;
    for (const [word, weight] of Object.entries(nextWords)) {
        runningTotal += weight;
        if (randomWeight < runningTotal) {
            return word;
        }
    }

    return ''; // Default return, aslında buraya ulaşmamalı
}

// İki kelimeye göre tahmin yapar
function generateSentence(first, second, wordCount) {
    let currentFirst = first.toLowerCase();
    let currentSecond = second.toLowerCase();
    let sentence = `${currentFirst} ${currentSecond}`;

    for (let i = 0; i < wordCount; ++i) {
        const key = `${currentFirst} ${currentSecond}`;
        if (!ngramMap[key]) {
            break;
        }

        const nextWord = getRandomNextWord(ngramMap[key]);
        sentence += ` ${nextWord}`;
        currentFirst = currentSecond;
        currentSecond = nextWord;
    }

    return sentence;
}

// Form gönderildiğinde cümle üretir
document.getElementById('ngram-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const wordsInput = document.getElementById('words').value.trim();
    const wordCount = parseInt(document.getElementById('wordCount').value, 10);

    let word1, word2;
    const words = wordsInput.split(' ');
    if (words.length < 2) {
        alert('Please enter at least two words.');
        return;
    } else if (words.length >= 2) {
        word1 = words[words.length - 2];
        word2 = words[words.length - 1];
    }

    if (Object.keys(ngramMap).length === 0) {
        await loadNGrams();
    }

    const sentence = generateSentence(word1, word2, wordCount);
    document.getElementById('result').textContent = sentence;
});
