import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
// เพิ่มการ Import Auth
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- Firebase Config (ใช้ตัวเดิมของคุณ) ---
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
const auth = getAuth(app); // สร้างตัวแปร auth

let items = [];
let isAdmin = false; // เปลี่ยนเป็น false เริ่มต้น
let isGlobalLocked = false;
let downloadPassHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

// --- 🔒 ระบบตรวจสอบสถานะ Admin (แบบ Real-time) ---
onAuthStateChanged(auth, (user) => {
    const panel = document.getElementById('admin-panel');
    const authBtn = document.getElementById('auth-btn');
    const statusText = document.getElementById('dash-status');
    const statusIcon = document.getElementById('status-icon');

    if (user) {
        isAdmin = true;
        if(panel) panel.style.display = 'block';
        if(authBtn) {
            authBtn.innerText = "Logout Admin";
            authBtn.style.background = "var(--danger)";
        }
        if(statusText) statusText.innerText = "Admin Mode";
        if(statusIcon) statusIcon.style.color = "#2ecc71";
    } else {
        isAdmin = false;
        if(panel) panel.style.display = 'none';
        if(authBtn) {
            authBtn.innerText = "Admin Login";
            authBtn.style.background = "var(--primary)";
        }
        if(statusText) statusText.innerText = "Guest Mode";
        if(statusIcon) statusIcon.style.color = "#95a5a6";
    }
    window.renderItems(); // รีเฟรชรายการไฟล์เพื่อแสดง/ซ่อนปุ่ม Edit
});

// --- 🔑 ฟังก์ชัน Login ใหม่ (ใช้ admin / admin2) ---
window.performLogin = () => {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;

    // เติมเมลเข้าไปข้างหลังอัตโนมัติ (ตามที่คุณตั้งใน Console)
    const email = user + "@cougar2.com"; 

    signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            document.getElementById('loginModal').style.display = 'none';
            alert("ยินดีต้อนรับ Admin!");
        })
        .catch((error) => {
            alert("Username หรือ Password ไม่ถูกต้อง!");
            console.error(error.message);
        });
};

// --- 🚪 ฟังก์ชัน Logout ---
window.toggleAuth = () => {
    if (auth.currentUser) {
        if (confirm("ต้องการออกจากระบบ Admin ใช่หรือไม่?")) {
            signOut(auth);
        }
    } else {
        document.getElementById('loginModal').style.display = 'flex';
    }
};

// --- 🛡️ การรักษาความปลอดภัยหน้าบ้าน (ปิดคลิกขวา/ปุ่ม Inspect) ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = (e) => {
    if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74)) || (e.ctrlKey && e.keyCode == 85)) {
        return false;
    }
};

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
    const lockSwitch = document.getElementById('globalLock');
    if(isAdmin && lockSwitch) lockSwitch.checked = isGlobalLocked;
    window.renderItems();
});

// --- UI Functions (คงเดิมแต่ปรับปรุงการ Render) ---
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

// --- (ส่วนฟังก์ชันอื่นๆ เช่น saveItem, editItem, secureDownload ให้คงเดิมตามโค้ดเก่าของคุณ) ---
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

window.changeDownloadPass = async () => {
    const newPass = prompt("กรุณากรอกรหัสผ่านดาวน์โหลดใหม่ที่คุณต้องการ:");
    if (newPass === null) return;
    if (newPass.trim() === "") return alert("กรุณากรอกรหัสผ่านที่ต้องการเปลี่ยน");
    try {
        const hash = await hashText(newPass);
        await update(ref(db, "settings"), { downloadPassHash: hash });
        alert("เปลี่ยนรหัสผ่านดาวน์โหลดสำเร็จ!");
    } catch (e) { alert("เกิดข้อผิดพลาด"); }
};

window.showPage = (id, el) => {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');
    document.getElementById('nav-title').innerText = el ? el.innerText.trim() : "Dashboard";
};

window.openImage = (src) => {
    const lb = document.getElementById('imgLightbox');
    document.getElementById('lightboxImg').src = src;
    lb.style.display = 'flex';
};

// --- Time ---
setInterval(() => {
    const timeEl = document.getElementById('dash-time');
    if(timeEl) timeEl.innerText = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}, 1000);
