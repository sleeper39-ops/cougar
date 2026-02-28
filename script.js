import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const auth = getAuth(app);

let items = [];
let isAdmin = false;
let isGlobalLocked = false;

// --- 🔒 ระบบตรวจสอบสถานะผู้ใช้งาน (Real-time) ---
onAuthStateChanged(auth, (user) => {
    const panel = document.getElementById('admin-panel');
    const authBtn = document.getElementById('auth-btn');
    const statusText = document.getElementById('dash-status');
    const statusIcon = document.getElementById('status-icon');

    // ตรวจสอบว่าเป็น Admin หรือไม่ (เช็คจาก Email)
    if (user && user.email === "admin@cougar2.com") {
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
    window.renderItems();
});

// --- 🔑 ฟังก์ชัน Login สำหรับ Admin (admin / admin2) ---
window.performLogin = () => {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const email = user.includes('@') ? user : user + "@cougar2.com"; 

    signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            document.getElementById('loginModal').style.display = 'none';
            // เคลียร์ค่าในช่อง Login
            document.getElementById('loginUser').value = '';
            document.getElementById('loginPass').value = '';
        })
        .catch((error) => {
            alert("Username หรือ Password ไม่ถูกต้อง!");
        });
};

// --- 📥 ฟังก์ชันดาวน์โหลด (ใช้ Authentication เช็ครหัสผ่าน) ---
window.secureDownload = async (link, itemLocked) => {
    const effectivelyLocked = isGlobalLocked || itemLocked;

    if (!effectivelyLocked) {
        window.open(link, '_blank');
        return;
    }

    const userPass = prompt("🔒 ไฟล์นี้ถูกล็อคไว้ กรุณาใส่รหัสดาวน์โหลด:");
    if (!userPass) return;

    // บัญชีที่ใช้เช็ครหัสผ่านดาวน์โหลดใน Firebase
    const downloadEmail = "download@cougar2.com";

    try {
        // ลอง Login ด้วยรหัสที่กรอกมา
        await signInWithEmailAndPassword(auth, downloadEmail, userPass);
        
        // ถ้าผ่าน ให้เปิดลิงก์
        window.open(link, '_blank');
        
        // ถ้าไม่ใช่ Admin ให้ Logout บัญชีดาวน์โหลดออกทันทีเพื่อคืนสถานะ Guest
        if (auth.currentUser.email === downloadEmail) {
            await signOut(auth);
        }
    } catch (error) {
        alert("❌ รหัสดาวน์โหลดไม่ถูกต้อง!");
    }
};

// --- 🚪 ฟังก์ชัน Logout ---
window.toggleAuth = () => {
    if (auth.currentUser) {
        if (confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
            signOut(auth);
        }
    } else {
        document.getElementById('loginModal').style.display = 'flex';
    }
};

// --- 🛡️ ความปลอดภัยหน้าบ้าน ---
document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = (e) => {
    if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74)) || (e.ctrlKey && e.keyCode == 85)) {
        return false;
    }
};

// --- Listeners ---
onValue(ref(db, "cougar_data"), (snap) => {
    const data = snap.val();
    items = data ? Object.keys(data).map(k => ({ key: k, ...data[k] })) : [];
    window.renderItems();
});

onValue(ref(db, "settings"), (snap) => {
    const s = snap.val() || {};
    isGlobalLocked = s.globalLock || false;
    const lockSwitch = document.getElementById('globalLock');
    if(isAdmin && lockSwitch) lockSwitch.checked = isGlobalLocked;
    window.renderItems();
});

// --- UI Functions ---
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

// ฟังก์ชันนี้ถูกยกเลิกเนื่องจากเปลี่ยนไปใช้ Password ใน Firebase Auth โดยตรง
window.changeDownloadPass = () => {
    alert("โปรดเปลี่ยนรหัสดาวน์โหลดผ่าน Firebase Console (Email: download@cougar2.com)");
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
