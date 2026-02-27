import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Config อัปเดตตามรูปที่ 84 ของคุณ
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

// --- ดึงข้อมูล (Sync) ---
onValue(itemsRef, (snapshot) => {
    const data = snapshot.val();
    // ถ้า Cloud เป็น null (เหมือนในรูป 78) ให้เริ่มด้วย Array ว่าง
    state.items = Array.isArray(data) ? data : []; 
    window.renderItems();
    window.updateDashboard();
}, (error) => {
    console.error("Firebase Connection Error:", error);
});

// --- บันทึกข้อมูล (Save) ---
window.saveItem = async function() {
    const name = document.getElementById('itemName')?.value.trim();
    const link = document.getElementById('itemLink')?.value.trim();
    const img = document.getElementById('itemImg')?.value.trim() || 'https://via.placeholder.com/300x180?text=Cougar2';
    const index = parseInt(document.getElementById('editIndex')?.value || "-1");

    if (name && link) {
        let updatedItems = [...state.items];
        const itemData = { name, link, img, locked: false };

        if (index > -1) updatedItems[index] = itemData;
        else updatedItems.push(itemData);

        try {
            // ส่งข้อมูลขึ้น Cloud
            await set(itemsRef, updatedItems);
            alert("✅ ส่งข้อมูลขึ้น Cloud สำเร็จ! เครื่องอื่นจะเห็นแล้วครับ");
            window.resetForm();
        } catch (e) {
            alert("❌ บันทึกไม่สำเร็จ: ตรวจสอบหน้า Rules ว่ากด Publish หรือยัง");
            console.error(e);
        }
    } else {
        alert("กรุณากรอกชื่อและลิงก์");
    }
};

// --- แสดงผล (Render) ---
window.renderItems = function() {
    const list = document.getElementById('download-list');
    if (!list) return; // ป้องกัน Error ใน Screenshot 81
    
    list.innerHTML = state.items.map((item, index) => `
        <div class="download-card">
            <div class="card-img-container">
                <img src="${item.img}" onerror="this.src='https://via.placeholder.com/300x180?text=Cougar2'">
            </div>
            <div class="download-info">
                <h4>${item.name}</h4>
                <button onclick="window.open('${item.link}', '_blank')" class="btn-download is-open">Download Now</button>
            </div>
            ${state.isAdmin ? `
                <div class="admin-controls" style="padding: 10px; border-top: 1px solid #eee;">
                    <button onclick="window.editItem(${index})" style="color: blue; border: none; background: none; cursor: pointer;">Edit</button>
                    <button onclick="window.deleteItem(${index})" style="color: red; border: none; background: none; cursor: pointer; margin-left: 10px;">Delete</button>
                </div>` : ''}
        </div>
    `).join('');
};

window.deleteItem = function(index) {
    if(confirm("ลบรายการนี้?")) {
        let updatedItems = [...state.items];
        updatedItems.splice(index, 1);
        set(itemsRef, updatedItems);
    }
};

window.editItem = function(index) {
    const item = state.items[index];
    if (item) {
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemLink').value = item.link;
        document.getElementById('itemImg').value = item.img;
        document.getElementById('editIndex').value = index;
        document.getElementById('btn-save').innerText = "Update";
    }
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
    document.getElementById('editIndex').value = '-1';
    document.getElementById('btn-save').innerText = "บันทึก";
};

// Auth Functions
window.performLogin = function() {
    const u = document.getElementById('loginUser')?.value;
    const p = document.getElementById('loginPass')?.value;
    if (u === "admin" && p === "admin2") {
        sessionStorage.setItem('isAdmin', 'true');
        location.reload();
    } else { alert("Login Failed!"); }
};

window.toggleAuth = function() {
    if (state.isAdmin) {
        sessionStorage.removeItem('isAdmin');
        location.reload();
    } else {
        document.getElementById('loginModal').style.display = 'flex';
    }
};
