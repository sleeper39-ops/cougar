import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, update, remove, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// --- Firebase Config (คงเดิมตามของคุณ) ---
const firebaseConfig = {
    apiKey: "AIzaSyD1SGjQXgfQykrV-psyDDwWbuqfTlE7Zhk",
    authDomain: "cougar2-database.firebaseapp.com",
    databaseURL: "https://cougar2-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cougar2-database",
    storageBucket: "cougar2-database.firebasestorage.app",
    messagingSenderId: "429808185249",
    appId: "1:429808185249:web:4afa08e0a7a973b00d25e0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let items = [];
let isAdmin = sessionStorage.getItem('isAdmin') === 'true';
let isGlobalLocked = false;
let downloadPassHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

// --- Helper Functions ---
async function hashText(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Listeners ---
onValue(ref(db, "cougar_data"), (snap) => {
    const data = snap.val();
    items = data ? Object.keys(data).map(k => ({ key: k, ...data[k] })) : [];
    window.renderItems();
});

onValue(ref(db, "settings"), (snap) => {
    const s = snap.val() || {};
    isGlobalLocked = s.globalLock || false;
    downloadPassHash = s.downloadPassHash || downloadPassHash;
    if(isAdmin && document.getElementById('globalLock')) {
        document.getElementById('globalLock').checked = isGlobalLocked;
    }
    window.renderItems();
});

// --- UI & Admin Logic (ก๊อปปี้จากเวอร์ชันก่อนหน้าของคุณได้เลย) ---
window.renderItems = () => { /* ... โค้ดเดิมของคุณ ... */ };
window.performLogin = () => {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    if(user === "admin" && pass === "admin2") {
        sessionStorage.setItem('isAdmin', 'true');
        location.reload();
    } else alert("Username หรือ Password ไม่ถูกต้อง");
};

// --- เพิ่มฟังก์ชัน Forgot Password ---
window.forgotPassword = () => {
    const correctKeyword = "password"; 
    const userKeyword = prompt("ใส่ Keyword เพื่อดูรหัสผ่าน:");
    if (userKeyword === null) return;
    if (userKeyword === correctKeyword) {
        alert("ตรวจสอบสำเร็จ!\n\nUsername: admin\nPassword: admin2");
    } else {
        alert("Keyword ไม่ถูกต้อง!");
    }
};

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    const loginUser = document.getElementById('loginUser');
    const loginPass = document.getElementById('loginPass');

    if (loginUser && loginPass) {
        loginUser.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); loginPass.focus(); }
        });
        loginPass.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); window.performLogin(); }
        });
    }

    if(isAdmin) {
        const panel = document.getElementById('admin-panel');
        if(panel) panel.style.display = 'block';
    }
    
    // นาฬิกาและส่วนอื่นๆ...
});
