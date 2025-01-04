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
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sayfa yüklendiğinde çalışacak
document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');

    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // Formun sayfayı yenilemesini engelle

        // Formdan alınan veriler
        const day = form.querySelector('select[name="day"]').value;
        const month = form.querySelector('select[name="month"]').value;
        const year = form.querySelector('select[name="year"]').value;
        const username = form.querySelector('input[name="username"]').value;
        const password = form.querySelector('input[name="password"]').value;
        const confirmPassword = form.querySelector('input[name="confirm_password"]').value;

        // Verilerin doğru girilip girilmediğini kontrol et
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Kullanıcı adının daha önce alınmış olup olmadığını kontrol et
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            alert("This username is already taken, please choose another one.");
            return;
        }

        // Firestore'dan mevcut kullanıcı ID'sini almak için
        const counterDocRef = doc(db, 'counters', 'user_id'); // ID'nin saklanacağı 'counters' koleksiyonu
        const counterSnap = await getDoc(counterDocRef);

        let userId = 1; // Başlangıç ID'si

        if (counterSnap.exists()) {
            // Eğer ID sayacı varsa, ID'yi bir arttırıyoruz
            userId = counterSnap.data().currentId + 1;
        }

        try {
            // Firestore'a kullanıcı verisini ekle
            const docRef = await addDoc(collection(db, "users"), {
                id: userId,
                username: username,
                birthday: `${day} ${month} ${year}`,
                password: password // Gerçek dünyada şifreyi şifrelemek gereklidir
            });

            // ID sayaçlarını güncelle
            await updateDoc(counterDocRef, {
                currentId: userId
            });

            // Güvenlik için usertoken oluştur ve localStorage'a kaydet
            const userToken = docRef.id; // Belge ID'sini token olarak kullan
            localStorage.setItem('userToken', userToken);
            localStorage.setItem('loggedIn', 'true'); // Oturum açıldığını belirten bir işaret

            alert("You have successfully signed up!");
            window.location.href = "home.html";

        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Error signing up. Please try again.");
        }
    });
});
