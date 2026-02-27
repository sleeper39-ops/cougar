import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, update, remove, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// --- Firebase Config ---
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

// --- Helper: Hash Function ---
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

// --- UI Functions ---
window.showPage = (id, el) => {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');
    else {
        const navEl = document.getElementById('nav-' + id.split('-')[0]);
        if(navEl) navEl.classList.add('active');
    }
    const navTitle = document.getElementById('nav-' + id.split('-')[0]);
    if(navTitle) document.getElementById('nav-title').innerText = navTitle.innerText.trim();
};

window.renderItems = () => {
    const list = document.getElementById('download-list');
    if(!list) return;
    list.innerHTML = '';
    
    items.forEach((item) => {
        const effectivelyLocked = isGlobalLocked || item.locked;
        const card = document.createElement('div');
        card.className = 'download-card';
        card.innerHTML = `
            <div class="card-img-container" onclick="window.openImage('${item.img || ''}')">
                <img src="${item.img || 'https://via.placeholder.com/300x180?text=Cougar2'}" class="card-img">
            </div>
            <div class="download-info">
                <h4>${item.name}</h4>
                <button onclick="window.secureDownload('${item.link}', ${item.locked})" 
                        class="btn-download"
                        style="background:${effectivelyLocked ? 'var(--warning)' : 'var(--success)'}; color:white;">
                    <i class="fas ${effectivelyLocked ? 'fa-lock' : 'fa-download'}"></i> 
                    ${effectivelyLocked ? 'Password Required' : 'Download Now'}
                </button>
            </div>
            ${isAdmin ? `
            <div class="admin-controls">
                <div style="display:flex; align-items:center; gap:5px;">
                    <label class="switch">
                        <input type="checkbox" ${item.locked ? 'checked' : ''} onchange="window.toggleItemLock('${item.key}', ${item.locked})">
                        <span class="slider"></span>
                    </label>
                    <span style="font-size:11px; font-weight:bold; color:#666;">Lock</span>
                </div>
                <button onclick="window.editItem('${item.key}')" class="admin-btn-text" style="color:var(--primary);"><i class="fas fa-edit"></i> Edit</button>
                <button onclick="window.deleteItem('${item.key}')" class="admin-btn-text" style="color:var(--danger);"><i class="fas fa-trash"></i> Delete</button>
            </div>` : ''}
        `;
        list.appendChild(card);
    });
    const countEl = document.getElementById('dash-count');
    if(countEl) countEl.innerText = items.length + " รายการ";
};

// --- Auth & Security ---
window.performLogin = () => {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    if(user === "admin" && pass === "admin2") {
        sessionStorage.setItem('isAdmin', 'true');
        location.reload();
    } else alert("Username หรือ Password ไม่ถูกต้อง");
};

// ฟังก์ชันลืมรหัสผ่านตามที่ต้องการ
window.forgotPassword = () => {
    const keyword = prompt("ใส่ Keyword เพื่อดูรหัสผ่าน:");
    if (keyword === null) return; // กดยกเลิก

    if (keyword === "password") {
        alert("ตรวจสอบสำเร็จ!\n\nUsername: admin\nPassword: admin2");
    } else {
        alert("Keyword ไม่ถูกต้อง!");
    }
};

window.toggleAuth = () => {
    if(isAdmin) {
        if(confirm("ต้องการออกจากระบบ Admin ใช่หรือไม่?")) {
            sessionStorage.removeItem('isAdmin');
            location.reload();
        }
    } else {
        const modal = document.getElementById('loginModal');
        if(modal) modal.style.display='flex';
    }
};

// --- Admin Actions ---
window.saveItem = async () => {
    const key = document.getElementById('editKey').value;
    const name = document.getElementById('itemName').value;
    const img = document.getElementById('itemImg').value;
    const link = document.getElementById('itemLink').value;
    if (!name || !link) return alert("กรุณากรอกชื่อและลิงก์โหลด");
    const data = { name, img, link, locked: false };
    if(key) await update(ref(db, `cougar_data/${key}`), data);
    else await push(ref(db, "cougar_data"), data);
    window.resetForm();
};

window.resetForm = () => {
    document.getElementById('editKey').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemImg').value = '';
    document.getElementById('itemLink').value = '';
    document.getElementById('btn-save').innerText = "บันทึก";
    document.getElementById('btn-save').style.background = "var(--success)";
};

window.editItem = (key) => {
    const item = items.find(i => i.key === key);
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemImg').value = item.img;
    document.getElementById('itemLink').value = item.link;
    document.getElementById('editKey').value = key;
    document.getElementById('btn-save').innerText = "Update";
    document.getElementById('btn-save').style.background = "var(--primary)";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteItem = (key) => confirm("ต้องการลบรายการนี้?") && remove(ref(db, `cougar_data/${key}`));
window.toggleItemLock = (key, curr) => update(ref(db, `cougar_data/${key}`), { locked: !curr });
window.toggleGlobalLock = () => {
    const isChecked = document.getElementById('globalLock').checked;
    update(ref(db, "settings"), { globalLock: isChecked });
};

window.secureDownload = async (link, itemLocked) => {
    if (isGlobalLocked || itemLocked) {
        const pass = prompt("ไฟล์นี้ถูกล็อคไว้ กรุณาใส่รหัสผ่าน:");
        if (!pass) return;
        const hashedInput = await hashText(pass);
        if (hashedInput === downloadPassHash) window.open(link, '_blank');
        else alert("รหัสผ่านไม่ถูกต้อง");
    } else window.open(link, '_blank');
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
        const authBtn = document.getElementById('auth-btn');
        if(authBtn) {
            authBtn.innerText = "Logout Admin";
            authBtn.style.background = "var(--danger)";
        }
        document.getElementById('dash-status').innerText = "Admin Mode";
        document.getElementById('status-icon').style.color = "#2ecc71";
    }
    
    setInterval(() => {
        const timeEl = document.getElementById('dash-time');
        if(timeEl) timeEl.innerText = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, 1000);
});

window.openImage = (src) => {
    const lb = document.getElementById('imgLightbox');
    document.getElementById('lightboxImg').src = src;
    lb.style.display = 'flex';
};
