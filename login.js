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
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sayfa yüklendiğinde çalışacak
document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');

    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // Formun sayfayı yenilemesini engelle

        // Formdan alınan veriler
        const username = form.querySelector('input[name="username"]').value;
        const password = form.querySelector('input[name="password"]').value;

        // Firestore'da kullanıcı adı ve şifreyi kontrol et
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("No account found with this username.");
            return;
        }

        let userFound = false;

        // Veritabanındaki kullanıcıları kontrol et
        querySnapshot.forEach((doc) => {
            const user = doc.data();
            if (user.password === password) {
                userFound = true;

                // Güvenlik için usertoken oluştur ve localStorage'a kaydet
                const userToken = doc.id; // Belge ID'sini token olarak kullan
                localStorage.setItem('userToken', userToken);

                window.location.href = "home.html";
            }
        });

        if (!userFound) {
            alert("Incorrect password.");
        }
    });
});
