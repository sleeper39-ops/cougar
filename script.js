import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ใช้ Config ล่าสุดจากรูปที่ 84 ของคุณ
const firebaseConfig = {
    apiKey: "AIzaSyD1SGjQXgfQykrV-psyDDwWbuqfTlE7Zhk",
    authDomain: "cougar2-database.firebaseapp.com",
    databaseURL: "https://cougar2-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cougar2-database",
    storageBucket: "cougar2-database.firebasestorage.app",
    messagingSenderId: "429808185249",
    appId: "1:429808185249:web:4afa08e0a7a973b00d25e0",
    measurementId: "G-VKV5NP9BFX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const itemsRef = ref(db, 'cougar_data');

let state = {
    items: [],
    isAdmin: sessionStorage.getItem('isAdmin') === 'true'
};

// --- ดึงข้อมูลจาก Cloud ---
onValue(itemsRef, (snapshot) => {
    const data = snapshot.val();
    state.items = Array.isArray(data) ? data : []; 
    console.log("Sync Complete. Items:", state.items.length);
    window.renderItems();
    window.updateDashboard();
}, (error) => {
    console.error("Firebase Sync Error:", error);
});

// --- ฟังก์ชันบันทึกข้อมูล (ปรับปรุงใหม่) ---
window.saveItem = async function() {
    const nameEl = document.getElementById('itemName');
    const linkEl = document.getElementById('itemLink');
    const imgEl = document.getElementById('itemImg');
    const indexEl = document.getElementById('editIndex');

    if (!nameEl || !linkEl) return;

    const name = nameEl.value.trim();
    const link = linkEl.value.trim();
    const img = imgEl.value.trim() || 'https://via.placeholder.com/300x180?text=No+Image';
    const index = parseInt(indexEl.value || "-1");

    if (name && link) {
        let updatedItems = [...state.items];
        const itemData = { name, link, img, locked: false };

        if (index > -1) updatedItems[index] = itemData;
        else updatedItems.push(itemData);

        try {
            await set(itemsRef, updatedItems);
            alert("✅ บันทึกสำเร็จ! ข้อมูลถูกส่งไป Cloud แล้ว");
            window.resetForm();
        } catch (err) {
            console.error("Save Error:", err);
            alert("❌ บันทึกไม่ได้! สาเหตุ: " + (err.code === 'PERMISSION_DENIED' ? "ยังไม่ได้กด Publish Rules ใน Firebase" : err.message));
        }
    } else {
        alert("กรุณากรอกชื่อและลิงก์");
    }
};

window.renderItems = function() {
    const list = document.getElementById('download-list');
    if (!list) return; // ป้องกัน Crash ใน Screenshot 81
    
    list.innerHTML = state.items.map((item, index) => `
        <div class="download-card">
            <div class="card-img-container"><img src="${item.img}" onerror="this.src='https://via.placeholder.com/300x180?text=Error'"></div>
            <div class="download-info">
                <h4>${item.name}</h4>
                <button onclick="window.open('${item.link}', '_blank')" class="btn-download is-open">Download</button>
            </div>
            ${state.isAdmin ? `
                <div class="admin-controls">
                    <button onclick="window.editItem(${index})">Edit</button>
                    <button onclick="window.deleteItem(${index})" style="color:red">Delete</button>
                </div>` : ''}
        </div>
    `).join('');
};

window.updateDashboard = function() {
    const countEl = document.getElementById('dash-count');
    if (countEl) countEl.innerText = `${state.items.length} รายการ`;
    const statusEl = document.getElementById('dash-status');
    if (statusEl) statusEl.innerText = state.isAdmin ? "Admin Mode" : "Guest Mode";
};

window.resetForm = function() {
    ['itemName', 'itemLink', 'itemImg'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    const idxEl = document.getElementById('editIndex');
    if(idxEl) idxEl.value = '-1';
};

window.performLogin = function() {
    const u = document.getElementById('loginUser')?.value;
    const p = document.getElementById('loginPass')?.value;
    if (u === "admin" && p === "admin2") {
        sessionStorage.setItem('isAdmin', 'true');
        location.reload();
    } else { alert("Login Failed!"); }
};
