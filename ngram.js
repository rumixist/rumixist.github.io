const fetch = window.fetch;

// Element references
const wordsInput = document.getElementById('words');
const wordCountInput = document.getElementById('wordCount');
const submitButton = document.getElementById('submitbutton'); // More descriptive name
const resultText = document.getElementById('result');

// Generate N-gram sentence on button click
submitButton.addEventListener('click', () => {
  const words = wordsInput.value.trim().split(' ');
  const wordCount = parseInt(wordCountInput.value);

  if (words.length < 4) {
    resultText.textContent = 'Please enter at least four words for n-gram generation.';
    return;
  }

  // HTTPS request with URL and body parameters for n-gram generation
  fetch('https://rumixist.pythonanywhere.com/generateNgram', { // More descriptive URL
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `words=${words.join(' ')}&wordCount=${wordCount}`
  })
  .then(response => response.json())
  .then(data => {
    resultText.textContent = data.sentence;
  })
  .catch(error => {
    console.error('Error fetching n-gram sentence:', error);
    if (error.response && error.response.status === 400) {  // Example check for bad request
      resultText.textContent = 'Invalid request. Please check your input.';
    } else {
      resultText.textContent = 'Error generating sentence.';
    }
  });
});
