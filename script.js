import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- 1. Configuration (ตรวจสอบ URL ให้เป๊ะ) ---
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

let state = {
    items: [],
    isGlobalLocked: false,
    isAdmin: sessionStorage.getItem('isAdmin') === 'true'
};

const ADMIN_CONF = { user: "admin", pass: "admin2", keyword: "password" };
const HASH_CONFIG = { dl: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4" };

// --- 2. Real-time Sync ---
onValue(itemsRef, (snapshot) => {
    console.log("Firebase Data Received:", snapshot.val()); // ตรวจสอบข้อมูลใน Console
    state.items = snapshot.val() || [];
    window.renderItems();
    updateDashboard();
}, (error) => {
    console.error("Firebase Read Error:", error);
});

onValue(configRef, (snapshot) => {
    const config = snapshot.val() || { isGlobalLocked: false };
    state.isGlobalLocked = config.isGlobalLocked;
    const lockToggle = document.getElementById('globalLock');
    if(lockToggle) lockToggle.checked = state.isGlobalLocked;
    window.renderItems();
});

// --- 3. Save Function (ปรับปรุงใหม่) ---
window.saveItem = async function() {
    const nameEl = document.getElementById('itemName');
    const linkEl = document.getElementById('itemLink');
    const imgEl = document.getElementById('itemImg');
    const indexEl = document.getElementById('editIndex');

    if (!nameEl || !linkEl) return;

    const index = parseInt(indexEl.value);
    const name = nameEl.value.trim();
    const img = imgEl.value.trim() || 'https://via.placeholder.com/300x180?text=Cougar2';
    const link = linkEl.value.trim();

    if (!name || !link) {
        alert("กรุณากรอกชื่อและลิงก์โหลด");
        return;
    }

    const newItem = { 
        name, 
        img, 
        link, 
        locked: (index > -1 && state.items[index] ? state.items[index].locked : false) 
    };
    
    let newItems = [...state.items];
    if (index > -1) newItems[index] = newItem;
    else newItems.push(newItem);
    
    try {
        await set(itemsRef, newItems);
        window.resetForm();
        alert("✅ บันทึกข้อมูลลง Cloud สำเร็จ!");
    } catch (err) {
        console.error("Save Error:", err);
        alert("❌ บันทึกไม่สำเร็จ! ตรวจสอบ Firebase Rules (ต้องเป็น true ทั้งคู่)");
    }
};

// --- 4. UI & Controls ---
window.deleteItem = function(index) {
    if(confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
        let newItems = [...state.items];
        newItems.splice(index, 1);
        set(itemsRef, newItems);
    }
};

window.renderItems = function() {
    const list = document.getElementById('download-list');
    if (!list) return;
    list.innerHTML = '';
    
    state.items.forEach((item, index) => {
        const effectivelyLocked = state.isGlobalLocked || item.locked;
        const adminUI = state.isAdmin ? `
            <div class="admin-controls">
                <label class="switch"><input type="checkbox" ${item.locked ? 'checked' : ''} onchange="window.toggleItemLock(${index})"><span class="slider"></span></label>
                <button onclick="window.editItem(${index})" class="admin-btn-text" style="color:var(--primary);">Edit</button>
                <button onclick="window.deleteItem(${index})" class="admin-btn-text" style="color:var(--danger);">Delete</button>
            </div>` : '';

        list.innerHTML += `
            <div class="download-card">
                <div class="card-img-container" onclick="window.openImage('${item.img}')">
                    <img src="${item.img}" onerror="this.src='https://via.placeholder.com/300x180?text=Cougar2'">
                </div>
                <div class="download-info">
                    <h4>${item.name}</h4>
                    <button onclick="window.secureDownload('${item.link}', ${item.locked})" class="btn-download ${effectivelyLocked ? 'is-locked' : 'is-open'}">
                        <i class="fas ${effectivelyLocked ? 'fa-lock' : 'fa-download'}"></i> 
                        ${effectivelyLocked ? 'Locked' : 'Download'}
                    </button>
                </div>
                ${adminUI}
            </div>`;
    });
};

window.toggleItemLock = function(index) {
    if(!state.items[index]) return;
    state.items[index].locked = !state.items[index].locked;
    set(itemsRef, state.items);
};

window.toggleGlobalLock = function() {
    const lockToggle = document.getElementById('globalLock');
    if(lockToggle) set(configRef, { isGlobalLocked: lockToggle.checked });
};

// --- 5. Auth & Helpers ---
window.performLogin = function() {
    const u = document.getElementById('loginUser')?.value;
    const p = document.getElementById('loginPass')?.value;
    if (u === ADMIN_CONF.user && p === ADMIN_CONF.pass) {
        sessionStorage.setItem('isAdmin', 'true');
        location.reload();
    } else { alert("Login Failed!"); }
};

window.toggleAuth = function() {
    if (state.isAdmin) {
        if(confirm("Logout?")) { sessionStorage.removeItem('isAdmin'); location.reload(); }
    } else { 
        const modal = document.getElementById('loginModal');
        if(modal) modal.style.display = 'flex'; 
    }
};

window.editItem = function(index) {
    const item = state.items[index];
    if(!item) return;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemImg').value = item.img;
    document.getElementById('itemLink').value = item.link;
    document.getElementById('editIndex').value = index;
    document.getElementById('btn-save').innerText = "Update";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.resetForm = function() {
    ['itemName', 'itemImg', 'itemLink', 'editIndex'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = (id === 'editIndex' ? '-1' : '');
    });
    const btn = document.getElementById('btn-save');
    if(btn) btn.innerText = "บันทึก";
};

window.openImage = function(src) {
    const lbImg = document.getElementById('lightboxImg');
    const lb = document.getElementById('imgLightbox');
    if(lbImg && lb) { lbImg.src = src; lb.style.display = 'flex'; }
};

async function hashText(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

window.secureDownload = async function(link, itemLocked) {
    if (state.isGlobalLocked || itemLocked) {
        const pass = prompt("ใส่รหัสผ่านเพื่อดาวน์โหลด:");
        if (!pass) return;
        const hashedInput = await hashText(pass);
        const currentHash = localStorage.getItem('custom_download_hash') || HASH_CONFIG.dl;
        if (hashedInput === currentHash) window.open(link, '_blank');
        else alert("รหัสผ่านไม่ถูกต้อง");
    } else { window.open(link, '_blank'); }
};

window.showPage = function(pageId) {
    document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');
    
    document.querySelectorAll('.sidebar a').forEach(el => el.classList.remove('active'));
    const navId = 'nav-' + pageId.split('-')[0];
    const nav = document.getElementById(navId);
    if(nav) nav.classList.add('active');
};

function updateDashboard() {
    const now = new Date();
    const timeEl = document.getElementById('dash-time');
    if(timeEl) timeEl.innerText = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    const countEl = document.getElementById('dash-count');
    if(countEl) countEl.innerText = state.items.length + " รายการ";
    const statusEl = document.getElementById('dash-status');
    if(statusEl) statusEl.innerText = state.isAdmin ? "Admin Mode" : "Guest Mode";
}

window.addEventListener('DOMContentLoaded', () => {
    const adminPanel = document.getElementById('admin-panel');
    if (state.isAdmin && adminPanel) adminPanel.style.display = 'block';
    updateDashboard();
    setInterval(updateDashboard, 1000);
});
