// auth.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyD7UpFdfkR7zVRgGHraIBX5mhacz1Wf7Xk",
    authDomain: "rumiaut.firebaseapp.com",
    projectId: "rumiaut",
    storageBucket: "rumiaut.firebasestorage.app",
    messagingSenderId: "459174728615",
    appId: "1:459174728615:web:5322adc03216b552481c82",
    measurementId: "G-9F41C1D4MV"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async function () {
    const userToken = localStorage.getItem('userToken');

    if (!userToken) {
        // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
        window.location.href = 'login.html';
        return;
    }

    try {
        // Firestore'da userToken geçerli mi kontrol et
        const userDocRef = doc(db, 'users', userToken);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // Eğer userToken geçersizse giriş sayfasına yönlendir
            localStorage.removeItem('userToken'); // Geçersiz token sil
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Error verifying userToken: ", error);
        window.location.href = 'login.html';
    }
});
