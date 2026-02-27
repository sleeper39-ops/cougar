import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
const itemsRef = ref(db, 'cougar_data');

let state = {
    items: [],
    isAdmin: sessionStorage.getItem('isAdmin') === 'true'
};

// --- ดึงข้อมูลจาก Cloud ---
onValue(itemsRef, (snapshot) => {
    state.items = snapshot.val() || [];
    window.renderItems();
    window.updateDashboard();
}, (error) => {
    console.error("Firebase Sync Error:", error);
});

// --- ฟังก์ชันบันทึกข้อมูล (แก้ไขใหม่) ---
window.saveItem = async function() {
    const name = document.getElementById('itemName')?.value.trim();
    const link = document.getElementById('itemLink')?.value.trim();
    const img = document.getElementById('itemImg')?.value.trim() || 'https://via.placeholder.com/300x180?text=Cougar2';
    const index = parseInt(document.getElementById('editIndex')?.value || "-1");

    if (name && link) {
        let newItems = [...state.items];
        const itemData = { name, link, img, locked: (index > -1 ? state.items[index].locked : false) };

        if (index > -1) newItems[index] = itemData;
        else newItems.push(itemData);

        try {
            await set(itemsRef, newItems);
            alert("✅ บันทึกข้อมูลสำเร็จ!");
            window.resetForm();
        } catch (e) {
            console.error("Save failed:", e);
            alert("❌ บันทึกไม่สำเร็จ: กรุณากด Publish Rules ใน Firebase");
        }
    } else {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    }
};

window.renderItems = function() {
    const list = document.getElementById('download-list');
    if (!list) return;
    list.innerHTML = state.items.map((item, index) => `
        <div class="download-card">
            <div class="card-img-container"><img src="${item.img}"></div>
            <div class="download-info">
                <h4>${item.name}</h4>
                <button onclick="window.open('${item.link}', '_blank')" class="btn-download is-open">Download</button>
            </div>
            ${state.isAdmin ? `<div class="admin-controls"><button onclick="window.deleteItem(${index})" style="color:red">Delete</button></div>` : ''}
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
    document.getElementById('itemName').value = '';
    document.getElementById('itemLink').value = '';
    document.getElementById('itemImg').value = '';
    document.getElementById('editIndex').value = '-1';
};

window.onload = () => { window.updateDashboard(); };
