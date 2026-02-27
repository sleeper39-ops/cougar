import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// --- การตั้งค่า Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyD1SGjQXgfQykrV-psyDDwWbuqfTlE7Zhk",
    authDomain: "cougar2-database.firebaseapp.com",
    databaseURL: "https://cougar2-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cougar2-database",
    storageBucket: "cougar2-database.firebasestorage.app",
    messagingSenderId: "429808185249",
    appId: "1:429808185249:web:4afa08e0a7a973b00d25e0"
};

// เริ่มต้น Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ตัวแปร Global
let items = [];
let isAdmin = sessionStorage.getItem('isAdmin') === 'true';
let isGlobalLocked = false;

// --- Firebase Listeners (ดึงข้อมูล Realtime) ---

// ดึงข้อมูลรายการไฟล์
onValue(ref(db, "cougar_data"), (snap) => {
    const data = snap.val();
    items = data ? Object.keys(data).map(k => ({ key: k, ...data[k] })) : [];
    window.renderItems();
});

// ดึงข้อมูลการตั้งค่า (การล็อคทั้งหมด)
onValue(ref(db, "settings"), (snap) => {
    const s = snap.val() || {};
    isGlobalLocked = s.globalLock || false;
    const lockCheckbox = document.getElementById('globalLock');
    if(isAdmin && lockCheckbox) lockCheckbox.checked = isGlobalLocked;
    window.renderItems();
});

// --- ฟังก์ชันการแสดงผลและ UI ---

// สลับหน้า Content
window.showPage = (id, el) => {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('nav-title').innerText = el.innerText.trim();
};

// วาดรายการ Download Card
window.renderItems = () => {
    const list = document.getElementById('download-list');
    if(!list) return;
    list.innerHTML = '';
    
    items.forEach(item => {
        const isLocked = isGlobalLocked || item.locked;
        const card = document.createElement('div');
        card.className = 'download-card';
        card.innerHTML = `
            <img src="${item.img || 'https://via.placeholder.com/300x180'}" class="card-img">
            <div style="padding:20px; text-align:center;">
                <h4 style="margin:0;">${item.name}</h4>
                <button onclick="window.handleDownload('${item.link}', ${item.locked})" 
                        class="btn-download" 
                        style="background:${isLocked ? 'var(--warning)' : 'var(--success)'}; color:white;">
                    <i class="fas ${isLocked ? 'fa-lock' : 'fa-download'}"></i> ${isLocked ? 'Locked' : 'Download'}
                </button>
            </div>
            ${isAdmin ? `
            <div style="padding:10px; border-top:1px solid #eee; display:flex; justify-content:space-around; align-items:center;">
                <button onclick="window.editItem('${item.key}')" style="border:none; background:none; color:var(--primary); cursor:pointer;"><i class="fas fa-edit"></i> Edit</button>
                <button onclick="window.deleteItem('${item.key}')" style="border:none; background:none; color:var(--danger); cursor:pointer;"><i class="fas fa-trash"></i> Delete</button>
                <input type="checkbox" ${item.locked ? 'checked' : ''} onchange="window.toggleItemLock('${item.key}', ${item.locked})">
            </div>` : ''}
        `;
        list.appendChild(card);
    });
    
    const countEl = document.getElementById('dash-count');
    if(countEl) countEl.innerText = items.length + " รายการ";
};

// --- ฟังก์ชัน Admin ---

// บันทึกหรืออัปเดตข้อมูล
window.saveItem = async () => {
    const key = document.getElementById('editKey').value;
    const data = {
        name: document.getElementById('itemName').value,
        img: document.getElementById('itemImg').value,
        link: document.getElementById('itemLink').value,
        locked: false
    };
    
    if(!data.name || !data.link) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");

    if(key) await update(ref(db, `cougar_data/${key}`), data);
    else await push(ref(db, "cougar_data"), data);
    
    // เคลียร์ฟอร์ม
    document.getElementById('editKey').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemImg').value = '';
    document.getElementById('itemLink').value = '';
    document.getElementById('btn-save').innerText = "บันทึก";
};

window.toggleItemLock = (key, curr) => update(ref(db, `cougar_data/${key}`), { locked: !curr });

window.toggleGlobalLock = () => {
    const isChecked = document.getElementById('globalLock').checked;
    update(ref(db, "settings"), { globalLock: isChecked });
};

window.deleteItem = (key) => confirm("คุณแน่ใจว่าต้องการลบไฟล์นี้หรือไม่?") && remove(ref(db, `cougar_data/${key}`));

window.editItem = (key) => {
    const item = items.find(i => i.key === key);
    if(item) {
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemImg').value = item.img;
        document.getElementById('itemLink').value = item.link;
        document.getElementById('editKey').value = key;
        document.getElementById('btn-save').innerText = "Update";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// --- ระบบดาวน์โหลดและการเข้าสู่ระบบ ---

window.handleDownload = (link, itemLocked) => {
    if(isGlobalLocked || itemLocked) {
        const pass = prompt("ไฟล์นี้ถูกล็อคไว้ ระบุรหัสผ่านดาวน์โหลด:");
        if(pass === "1234") window.open(link, '_blank');
        else if(pass !== null) alert("รหัสผ่านไม่ถูกต้อง");
    } else {
        window.open(link, '_blank');
    }
};

window.toggleAuth = () => {
    if(isAdmin) {
        sessionStorage.removeItem('isAdmin');
        location.reload();
    } else {
        document.getElementById('loginModal').style.display='flex';
    }
};

window.performLogin = () => {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    
    if(user === "admin" && pass === "admin2") {
        sessionStorage.setItem('isAdmin', 'true');
        location.reload();
    } else {
        alert("Username หรือ Password ไม่ถูกต้อง");
    }
};

// ตรวจสอบสถานะ Admin เมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', () => {
    if(isAdmin) {
        const panel = document.getElementById('admin-panel');
        const authBtn = document.getElementById('auth-btn');
        const dashStatus = document.getElementById('dash-status');
        const statusIcon = document.getElementById('status-icon');

        if(panel) panel.style.display = 'block';
        if(authBtn) {
            authBtn.innerText = "Logout Admin";
            authBtn.style.background = "var(--danger)";
        }
        if(dashStatus) dashStatus.innerText = "Admin Mode";
        if(statusIcon) statusIcon.style.color = "#2ecc71";
    }

    // นาฬิกา
    setInterval(() => {
        const timeEl = document.getElementById('dash-time');
        if(timeEl) timeEl.innerText = new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
    }, 1000);
});
