// 1. นำเข้า Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 2. Firebase Configuration (ใช้ตามโปรเจกต์ของคุณ)
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
const configRef = ref(db, 'system_config');

// --- Global State ---
let state = {
    items: [],
    isGlobalLocked: false,
    isAdmin: sessionStorage.getItem('isAdmin') === 'true'
};

const ADMIN_CONF = { user: "admin", pass: "admin2", keyword: "password" };
const HASH_CONFIG = { dl: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4" };

// --- 3. ดึงข้อมูลจาก Cloud (Real-time Sync) ---
onValue(itemsRef, (snapshot) => {
    state.items = snapshot.val() || [];
    renderItems();
    updateDashboard();
});

onValue(configRef, (snapshot) => {
    const config = snapshot.val() || { isGlobalLocked: false };
    state.isGlobalLocked = config.isGlobalLocked;
    const lockToggle = document.getElementById('globalLock');
    if(lockToggle) lockToggle.checked = state.isGlobalLocked;
    renderItems();
});

// --- 4. ฟังก์ชันจัดการข้อมูล (ผูกกับ Window) ---

window.saveItem = function() {
    const index = parseInt(document.getElementById('editIndex').value);
    const name = document.getElementById('itemName').value;
    const img = document.getElementById('itemImg').value;
    const link = document.getElementById('itemLink').value;

    if (name && link) {
        const newItem = { 
            name, 
            img: img || 'https://via.placeholder.com/300x180?text=Cougar2', 
            link, 
            locked: (index > -1 ? state.items[index].locked : false) 
        };

        if (index > -1) state.items[index] = newItem;
        else state.items.push(newItem);

        set(itemsRef, state.items); // ส่งขึ้น Cloud ทันที
        resetForm();
    } else {
        alert("กรุณากรอกชื่อและลิงก์โหลด");
    }
};

window.deleteItem = function(index) {
    if(confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
        state.items.splice(index, 1);
        set(itemsRef, state.items);
    }
};

window.toggleItemLock = function(index) {
    state.items[index].locked = !state.items[index].locked;
    set(itemsRef, state.items);
};

window.toggleGlobalLock = function() {
    const isLocked = document.getElementById('globalLock').checked;
    set(configRef, { isGlobalLocked: isLocked });
};

// --- 5. ฟังก์ชัน UI & Navigation ---

window.renderItems = function() {
    const list = document.getElementById('download-list');
    if (!list) return;
    list.innerHTML = '';

    state.items.forEach((item, index) => {
        const effectivelyLocked = state.isGlobalLocked || item.locked;
        const adminUI = state.isAdmin ? `
            <div class="admin-controls">
                <div style="display:flex; align-items:center; gap:5px;">
                    <label class="switch"><input type="checkbox" ${item.locked ? 'checked' : ''} onchange="window.toggleItemLock(${index})"><span class="slider"></span></label>
                    <span style="font-size:11px; font-weight:bold; color:#666;">Lock</span>
                </div>
                <button onclick="window.editItem(${index})" class="admin-btn-text" style="color:var(--primary);"><i class="fas fa-edit"></i> Edit</button>
                <button onclick="window.deleteItem(${index})" class="admin-btn-text" style="color:var(--danger);"><i class="fas fa-trash"></i> Delete</button>
            </div>` : '';

        list.innerHTML += `
            <div class="download-card">
                <div class="card-img-container" onclick="window.openImage('${item.img}')">
                    <img src="${item.img}" onerror="this.src='https://via.placeholder.com/300x180?text=Image+Error'">
                </div>
                <div class="download-info">
                    <h4>${item.name}</h4>
                    <button onclick="window.secureDownload('${item.link}', ${item.locked})" class="btn-download ${effectivelyLocked ? 'is-locked' : 'is-open'}">
                        <i class="fas ${effectivelyLocked ? 'fa-lock' : 'fa-download'}"></i> 
                        ${effectivelyLocked ? 'Password Required' : 'Download Now'}
                    </button>
                </div>
                ${adminUI}
            </div>`;
    });
};

window.showPage = function(pageId) {
    document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.sidebar a').forEach(el => el.classList.remove('active'));
    const navId = 'nav-' + pageId.split('-')[0];
    if(document.getElementById(navId)) document.getElementById(navId).classList.add('active');
    
    // Update Title
    const titles = {'dash-page': 'Dashboard', 'live-page': 'Live System', 'map-page': 'Map', 'calendar-page': 'Calendar'};
    document.getElementById('nav-title').innerText = titles[pageId] || 'Cougar2';
};

// --- 6. Auth & Security ---

window.toggleAuth = function() {
    if (state.isAdmin) {
        if(confirm("ต้องการออกจากระบบ Admin?")) {
            sessionStorage.removeItem('isAdmin');
            location.reload();
        }
    } else {
        document.getElementById('loginModal').style.display = 'flex';
    }
};

window.performLogin = function() {
    const u = document.getElementById('loginUser').value;
    const p = document.getElementById('loginPass').value;
    if (u === ADMIN_CONF.user && p === ADMIN_CONF.pass) {
        sessionStorage.setItem('isAdmin', 'true');
        location.reload();
    } else {
        alert("รหัสผ่านผิด!");
    }
};

window.secureDownload = async function(link, itemLocked) {
    if (state.isGlobalLocked || itemLocked) {
        const pass = prompt("กรุณาใส่รหัสผ่านเพื่อดาวน์โหลด:");
        if (!pass) return;
        const hashedInput = await hashText(pass);
        const currentHash = localStorage.getItem('custom_download_hash') || HASH_CONFIG.dl;
        if (hashedInput === currentHash) window.open(link, '_blank');
        else alert("รหัสผ่านไม่ถูกต้อง");
    } else {
        window.open(link, '_blank');
    }
};

// --- Helper Functions ---

async function hashText(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

window.openImage = function(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('imgLightbox').style.display = 'flex';
};

window.editItem = function(index) {
    const item = state.items[index];
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemImg').value = item.img;
    document.getElementById('itemLink').value = item.link;
    document.getElementById('editIndex').value = index;
    document.getElementById('btn-save').innerText = "Update";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.resetForm = function() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemImg').value = '';
    document.getElementById('itemLink').value = '';
    document.getElementById('editIndex').value = '-1';
    document.getElementById('btn-save').innerText = "บันทึก";
};

function updateDashboard() {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    if(document.getElementById('dash-time')) document.getElementById('dash-time').innerText = timeStr;
    if(document.getElementById('dash-count')) document.getElementById('dash-count').innerText = state.items.length + " รายการ";
    
    const statusText = document.getElementById('dash-status');
    if(statusText) {
        statusText.innerText = state.isAdmin ? "Admin Mode" : "Guest Mode";
        document.getElementById('status-icon').style.color = state.isAdmin ? "#2ecc71" : "#95a5a6";
    }
}

// เริ่มต้นระบบ
window.onload = () => {
    if (state.isAdmin) {
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('auth-btn').innerText = "Logout Admin";
        document.getElementById('auth-btn').style.background = "var(--danger)";
    }
    updateDashboard();
    setInterval(updateDashboard, 1000);
};
