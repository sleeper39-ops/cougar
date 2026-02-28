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

// ฟังก์ชันช่วยถอดรหัส (Base64)
const _d = (v) => atob(v);

// --- 🔒 ระบบตรวจสอบสถานะผู้ใช้งาน (Real-time) ---
onAuthStateChanged(auth, (user) => {
    const panel = document.getElementById('admin-panel');
    const authBtn = document.getElementById('auth-btn');
    const statusText = document.getElementById('dash-status');
    const statusIcon = document.getElementById('status-icon');

    // ตรวจสอบสิทธิ์ Admin โดยใช้ Base64 (YWRtaW5AY291Z2FyMi5jb20= = admin@cougar2.com)
    if (user && user.email === _d("YWRtaW5AY291Z2FyMi5jb20=")) {
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

// --- 🔑 ฟังก์ชัน Login สำหรับ Admin ---
window.performLogin = () => {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    if (!user || !pass) return alert("กรุณากรอกข้อมูลให้ครบ");

    // ซ่อน Domain ด้วย Base64 (QGNvdWdhcjIuY29t = @cougar2.com)
    const email = user.includes('@') ? user : user + _d("QGNvdWdhcjIuY29t"); 

    signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('loginUser').value = '';
            document.getElementById('loginPass').value = '';
        })
        .catch(() => alert("Username หรือ Password ไม่ถูกต้อง!"));
};

// ฟังก์ชันตรวจจับการกดปุ่ม Enter ใน Modal Login
['loginUser', 'loginPass'].forEach(id => {
    document.getElementById(id)?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.performLogin();
    });
});

// ฟังก์ชันเริ่มกระบวนการดาวน์โหลด (ซ่อนลิงก์จาก HTML)
window.startDownload = (idx) => {
    const item = items[idx];
    if (item) window.secureDownload(item.link, item.locked);
};

// --- 📥 ฟังก์ชันดาวน์โหลดปลอดภัย ---
window.secureDownload = async (link, itemLocked) => {
    const effectivelyLocked = isGlobalLocked || itemLocked;

    if (!effectivelyLocked) {
        window.open(link, '_blank');
        return;
    }

    const userPass = prompt("🔒 ไฟล์นี้ถูกล็อคไว้ กรุณาใส่รหัสดาวน์โหลด:");
    if (!userPass) return;

    try {
        // ใช้ Base64 สำหรับอีเมลดาวน์โหลด (ZG93bmxvYWRAY291Z2FyMi5jb20= = download@cougar2.com)
        const dEmail = _d("ZG93bmxvYWRAY291Z2FyMi5jb20=");
        await signInWithEmailAndPassword(auth, dEmail, userPass);
        
        window.open(link, '_blank');
        
        if (auth.currentUser && auth.currentUser.email === dEmail) {
            await signOut(auth);
        }
    } catch (error) {
        alert("❌ รหัสดาวน์โหลดไม่ถูกต้อง!");
    }
};

// --- 🚪 Logout ---
window.toggleAuth = () => {
    if (auth.currentUser) {
        if (confirm("ต้องการออกจากระบบใช่หรือไม่?")) signOut(auth);
    } else {
        document.getElementById('loginModal').style.display = 'flex';
    }
};



// --- 📡 Listeners ---
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

// --- 🖥️ UI Rendering ---
window.renderItems = () => {
    const list = document.getElementById('download-list');
    if(!list) return;
    list.innerHTML = '';
    
    items.forEach((item, index) => {
        const effectivelyLocked = isGlobalLocked || item.locked;
        const card = document.createElement('div');
        card.className = 'download-card';
        
        // ใช้ index แทนการโชว์ Link ตรงๆ ใน HTML
        card.innerHTML = `
            <div class="card-img-container" onclick="window.openImage('${item.img || ''}')">
                <img src="${item.img || 'https://via.placeholder.com/300x180?text=Cougar2'}" class="card-img">
            </div>
            <div class="download-info">
                <h4>${item.name}</h4>
                <button onclick="window.startDownload(${index})" 
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

// --- 🛠️ Admin Actions ---
window.saveItem = async () => {
    if (!isAdmin) return;
    const key = document.getElementById('editKey').value;
    const name = document.getElementById('itemName').value;
    const img = document.getElementById('itemImg').value;
    const link = document.getElementById('itemLink').value;
    if (!name || !link) return alert("กรุณากรอกชื่อและลิงก์โหลด");

    const data = { name, img, link, locked: key ? items.find(i => i.key === key).locked : false };
    if(key) await update(ref(db, `cougar_data/${key}`), data);
    else await push(ref(db, "cougar_data"), data);
    window.resetForm();
};

window.resetForm = () => {
    document.getElementById('editKey').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemImg').value = '';
    document.getElementById('itemLink').value = '';
    const btn = document.getElementById('btn-save');
    if(btn) {
        btn.innerText = "บันทึก";
        btn.style.background = "var(--success)";
    }
};

window.editItem = (key) => {
    if (!isAdmin) return;
    const item = items.find(i => i.key === key);
    if (!item) return;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemImg').value = item.img;
    document.getElementById('itemLink').value = item.link;
    document.getElementById('editKey').value = key;
    const btn = document.getElementById('btn-save');
    if(btn) {
        btn.innerText = "Update";
        btn.style.background = "var(--primary)";
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteItem = (key) => isAdmin && confirm("ต้องการลบรายการนี้?") && remove(ref(db, `cougar_data/${key}`));
window.toggleItemLock = (key, curr) => isAdmin && update(ref(db, `cougar_data/${key}`), { locked: !curr });
window.toggleGlobalLock = () => {
    if (!isAdmin) return;
    const isChecked = document.getElementById('globalLock').checked;
    update(ref(db, "settings"), { globalLock: isChecked });
};

window.showPage = (id, el) => {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');
    const navTitle = document.getElementById('nav-title');
    if(navTitle) navTitle.innerText = el ? el.innerText.trim() : "Dashboard";
};

window.openImage = (src) => {
    if (!src) return;
    const lb = document.getElementById('imgLightbox');
    const lbImg = document.getElementById('lightboxImg');
    if(lb && lbImg) {
        lbImg.src = src;
        lb.style.display = 'flex';
    }
};

setInterval(() => {
    const timeEl = document.getElementById('dash-time');
    if(timeEl) timeEl.innerText = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}, 1000);


