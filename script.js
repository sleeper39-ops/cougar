import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- 1. Firebase Configuration ---
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

// --- 2. Real-time Sync ---
onValue(itemsRef, (snapshot) => {
    const data = snapshot.val();
    console.log("📡 ข้อมูลจาก Cloud อัปเดตแล้ว:", data);
    
    if (!data) state.items = [];
    else if (Array.isArray(data)) state.items = data;
    else state.items = Object.values(data);
    
    window.renderItems();
    window.updateDashboard();
}, (error) => {
    console.error("❌ Firebase Sync Error:", error);
});

// --- 3. Save Function (ปรับปรุงใหม่ให้กัน Error) ---
window.saveItem = async function() {
    console.log("🚀 กำลังเตรียมส่งข้อมูล...");
    
    const nameEl = document.getElementById('itemName');
    const linkEl = document.getElementById('itemLink');
    const imgEl = document.getElementById('itemImg');
    const indexEl = document.getElementById('editIndex');

    // ดัก Error ถ้าหา ID ใน HTML ไม่เจอ
    if (!nameEl || !linkEl) {
        console.error("❌ ตรวจพบ ID ใน HTML ไม่ตรงกับ Script! กรุณาเช็ค ID 'itemName' และ 'itemLink'");
        alert("ระบบขัดข้อง: หาช่องกรอกข้อมูลไม่เจอ");
        return;
    }

    const name = nameEl.value.trim();
    const link = linkEl.value.trim();
    const img = imgEl.value.trim() || 'https://via.placeholder.com/300x180?text=No+Image';
    const index = parseInt(indexEl?.value || "-1");

    if (name && link) {
        let updatedItems = [...state.items];
        const itemData = { name, link, img, locked: false };

        if (index > -1) updatedItems[index] = itemData;
        else updatedItems.push(itemData);

        try {
            console.log("📤 กำลังเขียนข้อมูลลง Firebase...");
            await set(itemsRef, updatedItems); 
            console.log("✅ เขียนข้อมูลสำเร็จ!");
            alert("✅ บันทึกสำเร็จ! ข้อมูลออนไลน์แล้วทุกเครื่อง");
            window.resetForm();
        } catch (err) {
            console.error("🔥 Save Error:", err);
            alert("❌ บันทึกไม่สำเร็จ: " + err.message);
        }
    } else {
        alert("กรุณากรอกชื่อและลิงก์ให้ครบถ้วน");
    }
};

// --- 4. UI Rendering ---
window.renderItems = function() {
    const list = document.getElementById('download-list');
    if (!list) return;
    
    if (state.items.length === 0) {
        list.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; color:#999;"><h3>☁️ ข้อมูลบน Cloud ว่างเปล่า</h3></div>';
        return;
    }

    list.innerHTML = state.items.map((item, index) => `
        <div class="download-card">
            <div class="card-img-container" onclick="window.openImage('${item.img}')">
                <img src="${item.img}" onerror="this.src='https://via.placeholder.com/300x180?text=Error'">
            </div>
            <div class="download-info">
                <h4>${item.name}</h4>
                <button onclick="window.open('${item.link}', '_blank')" class="btn-download is-open">
                    <i class="fas fa-download"></i> Download Now
                </button>
            </div>
            ${state.isAdmin ? `
                <div class="admin-controls" style="padding:10px; display:flex; gap:10px; justify-content:center;">
                    <button class="admin-btn-text" style="color:blue;" onclick="window.editItem(${index})">Edit</button>
                    <button class="admin-btn-text" style="color:red;" onclick="window.deleteItem(${index})">Delete</button>
                </div>` : ''}
        </div>
    `).join('');
};

// --- 5. Admin Helpers ---
window.deleteItem = async function(index) {
    if (confirm("ต้องการลบรายการนี้ออกจากระบบ Cloud ใช่หรือไม่?")) {
        let updatedItems = [...state.items];
        updatedItems.splice(index, 1);
        try {
            await set(itemsRef, updatedItems);
        } catch (err) {
            alert("ลบไม่สำเร็จ: " + err.message);
        }
    }
};

window.editItem = function(index) {
    const item = state.items[index];
    if (item) {
        if(document.getElementById('itemName')) document.getElementById('itemName').value = item.name;
        if(document.getElementById('itemLink')) document.getElementById('itemLink').value = item.link;
        if(document.getElementById('itemImg')) document.getElementById('itemImg').value = item.img;
        if(document.getElementById('editIndex')) document.getElementById('editIndex').value = index;
        if(document.getElementById('btn-save')) document.getElementById('btn-save').innerText = "อัปเดตข้อมูล";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.resetForm = function() {
    ['itemName', 'itemLink', 'itemImg'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    if(document.getElementById('editIndex')) document.getElementById('editIndex').value = '-1';
    if(document.getElementById('btn-save')) document.getElementById('btn-save').innerText = "บันทึก";
};

window.updateDashboard = function() {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    if(document.getElementById('dash-time')) document.getElementById('dash-time').innerText = timeStr;
    if(document.getElementById('dash-count')) document.getElementById('dash-count').innerText = `${state.items.length} รายการ`;
    
    const statusEl = document.getElementById('dash-status');
    const authBtn = document.getElementById('auth-btn');
    const adminPanel = document.getElementById('admin-panel');

    if (state.isAdmin) {
        if(statusEl) statusEl.innerText = "Admin Mode";
        if(authBtn) { authBtn.innerText = "Admin Logout"; authBtn.style.background = "var(--danger)"; }
        if(adminPanel) adminPanel.style.display = 'block';
    } else {
        if(statusEl) statusEl.innerText = "Guest Mode";
        if(authBtn) { authBtn.innerText = "Admin Login"; authBtn.style.background = "var(--primary)"; }
        if(adminPanel) adminPanel.style.display = 'none';
    }
};

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
        if(confirm("ต้องการออกจากระบบ?")) { sessionStorage.removeItem('isAdmin'); location.reload(); }
    } else { 
        const modal = document.getElementById('loginModal');
        if(modal) modal.style.display = 'flex'; 
    }
};

window.showPage = function(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');
    
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    const navId = 'nav-' + pageId.split('-')[0];
    document.getElementById(navId)?.classList.add('active');
    
    const titles = { 'dash-page': 'Dashboard', 'live-page': 'Live CCTV', 'map-page': 'System Map', 'calendar-page': 'Calendar' };
    if(document.getElementById('nav-title')) document.getElementById('nav-title').innerText = titles[pageId] || 'Cougar2';
};

window.openImage = function(src) {
    const lb = document.getElementById('imgLightbox');
    const img = document.getElementById('lightboxImg');
    if(lb && img) { img.src = src; lb.style.display = 'flex'; }
};

document.addEventListener('DOMContentLoaded', () => {
    window.updateDashboard();
    setInterval(window.updateDashboard, 1000);
});
