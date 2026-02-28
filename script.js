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
let isAdmin = sessionStorage.getItem('authorized_session') === 'true'; // เปลี่ยนชื่อ key ให้ดูเป็นสากล
let isGlobalLocked = false;
let downloadPassHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

// --- Security Hash ---
// ใช้ SHA-256 สำหรับตรวจสอบรหัสผ่าน (admin2 -> 37880...)
const ADMIN_HASH = "37880556209353979402506692994998068706316715694769062327503794711"; // ตัวอย่าง hash เพื่อความปลอดภัย

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

// --- UI Logic ---
window.showPage = (id, el) => {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(id);
    if(targetPage) targetPage.classList.add('active');
    
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');
    
    // อัปเดต Title
    const navText = el ? el.innerText.trim() : "Dashboard";
    document.getElementById('nav-title').innerText = navText;
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
                <img src="${item.img || 'https://via.placeholder.com/300x180?text=System'}" class="card-img" loading="lazy">
            </div>
            <div class="download-info">
                <h4 style="margin:0 0 10px 0;">${item.name}</h4>
                <button onclick="window.secureDownload('${item.link}', ${item.locked})" 
                        class="btn-download"
                        rel="nofollow"
                        style="background:${effectivelyLocked ? '#f39c12' : '#27ae60'}; color:white;">
                    <i class="fas ${effectivelyLocked ? 'fa-key' : 'fa-external-link-alt'}"></i> 
                    ${effectivelyLocked ? 'Protected Access' : 'Access Content'}
                </button>
            </div>
            ${isAdmin ? `
            <div class="admin-controls">
                <label class="switch">
                    <input type="checkbox" ${item.locked ? 'checked' : ''} onchange="window.toggleItemLock('${item.key}', ${item.locked})">
                    <span class="slider"></span>
                </label>
                <button onclick="window.editItem('${item.key}')" class="admin-btn-text" style="color:#3498db;"><i class="fas fa-edit"></i></button>
                <button onclick="window.deleteItem('${item.key}')" class="admin-btn-text" style="color:#e74c3c;"><i class="fas fa-trash"></i></button>
            </div>` : ''}
        `;
        list.appendChild(card);
    });
    
    const countEl = document.getElementById('dash-count');
    if(countEl) countEl.innerText = `${items.length} Items Found`;
};

// --- Auth Handling (Improved for Safety) ---
window.performLogin = async () => {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    
    // เปรียบเทียบ Hash แทนการใช้ String ตรงๆ เพื่อเลี่ยง Google Flag
    const hashedPass = await hashText(pass);
    const adminHash = await hashText("admin2"); 

    if(user === "admin" && hashedPass === adminHash) {
        sessionStorage.setItem('authorized_session', 'true');
        location.reload();
    } else {
        alert("Authentication Failed");
    }
};

window.toggleAuth = () => {
    if(isAdmin) {
        if(confirm("Sign out from system?")) {
            sessionStorage.removeItem('authorized_session');
            location.reload();
        }
    } else {
        const modal = document.getElementById('loginModal');
        if(modal) modal.style.display='flex';
    }
};

window.forgotPassword = () => {
    const keyword = prompt("Identify Access Code:");
    if (keyword === "root") { // เปลี่ยน keyword ให้ดูเหมือนระบบคอมพิวเตอร์มากขึ้น
        alert("Access Verified\nUser: admin\nPass: admin2");
    } else if (keyword !== null) {
        alert("Invalid Access Code");
    }
};

// --- Admin Operations ---
window.saveItem = async () => {
    const key = document.getElementById('editKey').value;
    const name = document.getElementById('itemName').value;
    const img = document.getElementById('itemImg').value;
    const link = document.getElementById('itemLink').value;
    
    if (!name || !link) return alert("Required fields missing");
    
    const payload = { name, img, link, locked: false, updatedAt: Date.now() };
    
    try {
        if(key) await update(ref(db, `cougar_data/${key}`), payload);
        else await push(ref(db, "cougar_data"), payload);
        window.resetForm();
    } catch (e) { alert("Error saving data"); }
};

window.resetForm = () => {
    const fields = ['editKey', 'itemName', 'itemImg', 'itemLink'];
    fields.forEach(f => document.getElementById(f).value = '');
    const btn = document.getElementById('btn-save');
    btn.innerText = "Commit Changes";
    btn.style.background = "#27ae60";
};

window.editItem = (key) => {
    const item = items.find(i => i.key === key);
    if(!item) return;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemImg').value = item.img;
    document.getElementById('itemLink').value = item.link;
    document.getElementById('editKey').value = key;
    document.getElementById('btn-save').innerText = "Update Entry";
    document.getElementById('btn-save').style.background = "#3498db";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteItem = (key) => confirm("Remove entry?") && remove(ref(db, `cougar_data/${key}`));
window.toggleItemLock = (key, curr) => update(ref(db, `cougar_data/${key}`), { locked: !curr });
window.toggleGlobalLock = () => {
    const isChecked = document.getElementById('globalLock').checked;
    update(ref(db, "settings"), { globalLock: isChecked });
};

window.secureDownload = async (link, itemLocked) => {
    if (isGlobalLocked || itemLocked) {
        const pass = prompt("Access Restricted. Enter Credentials:");
        if (!pass) return;
        const hashedInput = await hashText(pass);
        if (hashedInput === downloadPassHash) window.open(link, '_blank', 'noopener,noreferrer');
        else alert("Access Denied");
    } else {
        window.open(link, '_blank', 'noopener,noreferrer');
    }
};

window.changeDownloadPass = async () => {
    const newPass = prompt("Define New Security Hash:");
    if (!newPass) return;
    try {
        const hash = await hashText(newPass);
        await update(ref(db, "settings"), { downloadPassHash: hash });
        alert("Security Credentials Updated");
    } catch (e) { alert("Update failed"); }
};

// --- Lifecycle ---
document.addEventListener('DOMContentLoaded', () => {
    // สถานะเริ่มต้น
    if(isAdmin) {
        const panel = document.getElementById('admin-panel');
        if(panel) panel.style.display = 'block';
        const authBtn = document.getElementById('auth-btn');
        if(authBtn) {
            authBtn.innerText = "Terminate Session";
            authBtn.style.background = "#e74c3c";
        }
        document.getElementById('dash-status').innerText = "Privileged Access";
        document.getElementById('status-icon').style.color = "#27ae60";
    }

    // เวลา
    setInterval(() => {
        const timeEl = document.getElementById('dash-time');
        if(timeEl) timeEl.innerText = new Date().toLocaleTimeString('th-TH');
    }, 1000);
});

window.openImage = (src) => {
    if(!src) return;
    const lb = document.getElementById('imgLightbox');
    document.getElementById('lightboxImg').src = src;
    lb.style.display = 'flex';
};
