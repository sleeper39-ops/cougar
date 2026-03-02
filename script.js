import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, update, remove, onValue, increment, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
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

const _d = (v) => atob(v);

// --- 🔒 ตรวจสอบสถานะ Admin ---
onAuthStateChanged(auth, (user) => {
    const panel = document.getElementById('admin-panel');
    const authBtn = document.getElementById('auth-btn');
    const statusText = document.getElementById('dash-status');
    const statusIcon = document.getElementById('status-icon');

    if (user && user.email === _d("YWRtaW5AY291Z2FyMi5jb20=")) { 
        isAdmin = true;
        if(panel) panel.style.display = 'block';
        if(authBtn) {
            authBtn.innerText = "Logout Admin";
            authBtn.style.background = "var(--danger)";
        }
        if(statusText) statusText.innerText = "Admin Mode";
        if(statusIcon) {
            statusIcon.style.color = "#2ecc71";
            statusIcon.className = "fas fa-user-shield";
        }
    } else {
        isAdmin = false;
        if(panel) panel.style.display = 'none';
        if(authBtn) {
            authBtn.innerText = "Admin Login";
            authBtn.style.background = "var(--primary)";
        }
        if(statusText) statusText.innerText = "Guest Mode";
        if(statusIcon) {
            statusIcon.style.color = "#95a5a6";
            statusIcon.className = "fas fa-user";
        }
    }
    window.renderItems();
});

// --- 🔑 Login Function ---
window.performLogin = () => {
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    if (!user || !pass) return alert("กรุณากรอกข้อมูลให้ครบ");
    const email = user.includes('@') ? user : user + _d("QGNvdWdhcjIuY29t");
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('loginUser').value = '';
            document.getElementById('loginPass').value = '';
        })
        .catch(() => alert("Username หรือ Password ไม่ถูกต้อง!"));
};

// --- 📥 Download System ---
window.startDownload = async (idx) => {
    const item = items[idx];
    if (!item) return;

    const effectivelyLocked = isGlobalLocked || item.locked;
    
    if (!effectivelyLocked) {
        // อัปเดตยอดดาวน์โหลดใน Firebase
        await update(ref(db, `cougar_data/${item.key}`), {
            downloads: increment(1)
        });
        window.open(item.link, '_blank', 'noopener,noreferrer');
    } else {
        window.secureDownload(item);
    }
};

window.secureDownload = async (item) => {
    const userPass = prompt("🔒 ไฟล์นี้ถูกล็อคไว้ กรุณาใส่รหัสดาวน์โหลด:");
    if (!userPass) return;
    try {
        const dEmail = _d("ZG93bmxvYWRAY291Z2FyMi5jb20="); 
        // ตรวจสอบรหัสผ่านผ่าน Firebase Auth (ชั่วคราว)
        await signInWithEmailAndPassword(auth, dEmail, userPass);
        
        await update(ref(db, `cougar_data/${item.key}`), {
            downloads: increment(1)
        });

        window.open(item.link, '_blank', 'noopener,noreferrer');
        // ออกจากระบบดาวน์โหลดทันที เพื่อไม่ให้กระทบสิทธิ์ Admin
        await signOut(auth); 
    } catch (error) {
        alert("❌ รหัสดาวน์โหลดไม่ถูกต้อง!");
    }
};

window.toggleAuth = () => {
    if (auth.currentUser) {
        if (confirm("ต้องการออกจากระบบใช่หรือไม่?")) signOut(auth);
    } else {
        document.getElementById('loginModal').style.display = 'flex';
    }
};

// --- 📡 Firebase Real-time Sync ---
onValue(ref(db, "cougar_data"), (snap) => {
    const data = snap.val();
    items = data ? Object.keys(data).map(k => ({ key: k, ...data[k] })) : [];
    window.renderItems();
});

onValue(ref(db, "settings"), (snap) => {
    const s = snap.val() || {};
    isGlobalLocked = s.globalLock || false;
    const lockSwitch = document.getElementById('globalLock');
    if(lockSwitch) lockSwitch.checked = isGlobalLocked;
    window.renderItems();
});

// --- 🖥️ UI Rendering ---
window.renderItems = () => {
    const list = document.getElementById('download-list');
    if(!list) return;
    list.innerHTML = '';
    
    items.forEach((item, index) => {
        const effectivelyLocked = isGlobalLocked || item.locked;
        const count = item.downloads || 0;
        const card = document.createElement('div');
        card.className = 'download-card';
        
        card.innerHTML = `
            <div class="card-img-container" onclick="window.openImage('${item.img || ''}')">
                <div class="download-count-badge">
                    <i class="fas fa-eye"></i> ${count}
                </div>
                <img src="${item.img || 'https://via.placeholder.com/300x180?text=Cougar2'}" class="card-img" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
            </div>
            <div class="download-info">
                <h4>${item.name}</h4>
                <button onclick="window.startDownload(${index})" 
                        class="btn-download"
                        style="background:${effectivelyLocked ? 'var(--warning)' : 'var(--primary)'}; color:white;">
                    <i class="fas ${effectivelyLocked ? 'fa-lock' : 'fa-download'}"></i> 
                    ${effectivelyLocked ? 'ระบุรหัสผ่าน' : 'ดาวน์โหลดตอนนี้'}
                </button>
            </div>
            
            <div class="admin-actions" style="${isAdmin ? 'display: flex;' : 'display: none;'}">
                <div class="admin-lock-group">
                    <label class="switch">
                        <input type="checkbox" ${item.locked ? 'checked' : ''} onchange="window.toggleItemLock('${item.key}', ${item.locked})">
                        <span class="slider"></span>
                    </label>
                    <span>ล็อคไฟล์</span>
                </div>
                
                <button onclick="window.editItem('${item.key}')" class="btn-admin-tool btn-edit-tool">
                    <i class="fas fa-edit"></i> แก้ไข
                </button>
                
                <button onclick="window.deleteItem('${item.key}')" class="btn-admin-tool btn-delete-tool">
                    <i class="fas fa-trash"></i> ลบ
                </button>
            </div>
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

    if (!name || !link) return alert("กรุณากรอกชื่อและลิงก์ดาวน์โหลด");

    const currentItem = key ? items.find(i => i.key === key) : null;
    
    const data = { 
        name: name, 
        img: img, 
        link: link, 
        locked: currentItem ? currentItem.locked : false,
        downloads: currentItem ? (currentItem.downloads || 0) : 0 
    };
    
    try {
        if(key) {
            await update(ref(db, `cougar_data/${key}`), data);
        } else {
            await push(ref(db, "cougar_data"), data);
        }
        window.resetForm();
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการบันทึก: " + e.message);
    }
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
    document.getElementById('itemImg').value = item.img || '';
    document.getElementById('itemLink').value = item.link;
    document.getElementById('editKey').value = key;
    const btn = document.getElementById('btn-save');
    if(btn) {
        btn.innerText = "อัปเดตข้อมูล";
        btn.style.background = "var(--primary)";
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteItem = (key) => {
    if (isAdmin && confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
        remove(ref(db, `cougar_data/${key}`));
    }
};

window.toggleItemLock = (key, currStatus) => {
    if (!isAdmin) return;
    update(ref(db, `cougar_data/${key}`), { locked: !currStatus });
};

window.toggleGlobalLock = () => {
    if (!isAdmin) return;
    const isChecked = document.getElementById('globalLock').checked;
    set(ref(db, "settings/globalLock"), isChecked);
};

// --- UI Navigation & Helpers ---
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

// Clock
setInterval(() => {
    const timeEl = document.getElementById('dash-time');
    if(timeEl) {
        const now = new Date();
        timeEl.innerText = now.getHours().toString().padStart(2, '0') + ":" + 
                           now.getMinutes().toString().padStart(2, '0') + ":" + 
                           now.getSeconds().toString().padStart(2, '0');
    }
}, 1000);
