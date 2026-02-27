/* ================= Firebase Import ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    set,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

/* ================= Firebase Config ================= */
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
let isAdmin = sessionStorage.getItem('isAdmin') === 'true'; // จำสถานะการเข้าสู่ระบบ

/* ================= Clock ================= */
setInterval(() => {
    const now = new Date();
    const timeEl = document.getElementById("dash-time");
    if (timeEl) {
        timeEl.innerText = now.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}, 1000);

/* ================= Realtime Load ================= */
onValue(ref(db, "cougar_data"), (snapshot) => {
    const data = snapshot.val();
    
    if (!data) {
        items = [];
    } else {
        // แปลง Object จาก Firebase ให้กลายเป็น Array พร้อมเก็บ Key (ID)
        items = Object.keys(data).map(id => ({
            id,
            ...data[id]
        }));
    }

    renderItems();
    updateDashboardUI();
});

/* ================= Render UI ================= */
function renderItems() {
    const container = document.getElementById("download-list");
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:gray; padding:20px;">☁️ ไม่มีข้อมูลบนคลาวด์</p>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const imgSrc = item.image && item.image.startsWith("http")
            ? item.image
            : "https://via.placeholder.com/300x180?text=Cougar2";

        return `
        <div class="download-card">
            <div class="card-img-container" onclick="window.openLightbox('${imgSrc}')">
                <img src="${imgSrc}" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
            </div>
            <div class="download-info">
                <h4>${item.name}</h4>
                <button class="btn-download ${item.locked ? 'is-locked' : 'is-open'}" 
                    ${item.locked && !isAdmin ? "disabled" : ""} 
                    onclick="window.openLink('${item.link}')">
                    ${item.locked ? '<i class="fas fa-lock"></i> Locked' : '<i class="fas fa-download"></i> Download'}
                </button>
            </div>
            ${isAdmin ? `
            <div class="admin-controls">
                <button class="admin-btn-text" style="color:blue" onclick="window.editItem('${item.id}')">Edit</button>
                <button class="admin-btn-text" style="color:red" onclick="window.deleteItem('${item.id}')">Delete</button>
                <button class="admin-btn-text" style="color:orange" onclick="window.toggleLock('${item.id}', ${item.locked})">
                    ${item.locked ? "Unlock" : "Lock"}
                </button>
            </div>` : ""}
        </div>`;
    }).join('');
}

/* ================= Save (Add / Edit) ================= */
window.saveItem = async function () {
    const name = document.getElementById("itemName").value.trim();
    const image = document.getElementById("itemImg").value.trim();
    const link = document.getElementById("itemLink").value.trim();
    const editId = document.getElementById("editId").value;

    if (!name || !link) {
        alert("กรุณากรอกชื่อและลิงก์");
        return;
    }

    try {
        if (editId) {
            // โหมดแก้ไข
            await update(ref(db, "cougar_data/" + editId), {
                name, image, link
            });
            alert("✅ อัปเดตข้อมูลสำเร็จ");
        } else {
            // โหมดเพิ่มใหม่
            const newRef = push(ref(db, "cougar_data"));
            await set(newRef, {
                name, image, link,
                locked: false,
                createdAt: Date.now()
            });
            alert("✅ เพิ่มข้อมูลลง Cloud สำเร็จ");
        }
        window.resetForm();
    } catch (err) {
        console.error("SAVE ERROR:", err);
        alert("❌ บันทึกไม่สำเร็จ: " + err.message);
    }
};

/* ================= Admin Functions ================= */
window.editItem = function (id) {
    const item = items.find(x => x.id === id);
    if (!item) return;

    document.getElementById("itemName").value = item.name;
    document.getElementById("itemImg").value = item.image || "";
    document.getElementById("itemLink").value = item.link;
    document.getElementById("editId").value = id;
    document.getElementById("btn-save").innerText = "Update Data";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteItem = async function (id) {
    if (!confirm("ยืนยันการลบข้อมูลนี้จาก Cloud?")) return;
    try {
        await remove(ref(db, "cougar_data/" + id));
    } catch (err) {
        alert("ลบไม่สำเร็จ: " + err.message);
    }
};

window.toggleLock = async function (id, currentStatus) {
    await update(ref(db, "cougar_data/" + id), {
        locked: !currentStatus
    });
};

window.resetForm = function () {
    document.getElementById("itemName").value = "";
    document.getElementById("itemImg").value = "";
    document.getElementById("itemLink").value = "";
    document.getElementById("editId").value = "";
    document.getElementById("btn-save").innerText = "บันทึก";
};

/* ================= Auth System ================= */
window.toggleAuth = function () {
    if (isAdmin) {
        if(confirm("ต้องการออกจากระบบแอดมิน?")) {
            sessionStorage.removeItem('isAdmin');
            location.reload();
        }
    } else {
        document.getElementById("loginModal").style.display = "flex";
    }
};

window.performLogin = function () {
    const user = document.getElementById("loginUser").value;
    const pass = document.getElementById("loginPass").value;

    if (user === "admin" && pass === "1234") {
        isAdmin = true;
        sessionStorage.setItem('isAdmin', 'true');
        document.getElementById("loginModal").style.display = "none";
        updateDashboardUI();
        renderItems();
    } else {
        alert("รหัสไม่ถูกต้อง");
    }
};

function updateDashboardUI() {
    const countEl = document.getElementById("dash-count");
    const statusEl = document.getElementById("dash-status");
    const adminPanel = document.getElementById("admin-panel");
    const authBtn = document.getElementById("auth-btn");

    if (countEl) countEl.innerText = items.length + " รายการ";
    
    if (isAdmin) {
        if (statusEl) statusEl.innerText = "Admin Mode";
        if (adminPanel) adminPanel.style.display = "block";
        if (authBtn) {
            authBtn.innerText = "Logout Admin";
            authBtn.style.background = "var(--danger)";
        }
    } else {
        if (statusEl) statusEl.innerText = "Guest Mode";
        if (adminPanel) adminPanel.style.display = "none";
        if (authBtn) {
            authBtn.innerText = "Admin Login";
            authBtn.style.background = "var(--primary)";
        }
    }
}

/* ================= Utilities ================= */
window.openLightbox = function (src) {
    const lightboxImg = document.getElementById("lightboxImg");
    if (lightboxImg) lightboxImg.src = src;
    document.getElementById("imgLightbox").style.display = "flex";
};

window.openLink = function (url) {
    window.open(url, "_blank");
};

window.showPage = function (pageId) {
    // ซ่อนทุกหน้า
    document.querySelectorAll(".page-content").forEach(p => p.classList.remove("active"));
    
    // แสดงหน้าที่เลือก
    const target = document.getElementById(pageId);
    if (target) target.classList.add("active");

    // อัปเดต Sidebar Active
    document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));
    
    // แมป ID ปุ่มใน Sidebar
    const navMapping = {
        'dash-page': 'nav-dash',
        'live-page': 'nav-live',
        'map-page': 'nav-map',
        'calendar-page': 'nav-cal'
    };
    
    const activeNavId = navMapping[pageId];
    if (activeNavId) document.getElementById(activeNavId).classList.add("active");
    
    // เปลี่ยนหัวข้อ Top Nav
    const titles = { 'dash-page': 'Dashboard', 'live-page': 'Live CCTV', 'map-page': 'Map View', 'calendar-page': 'Schedule' };
    document.getElementById('nav-title').innerText = titles[pageId] || 'Cougar2';
};

// รันครั้งแรกเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', updateDashboardUI);
