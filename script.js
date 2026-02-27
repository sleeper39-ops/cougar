// 1. นำเข้า Firebase Libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 2. Config ของคุณ
const firebaseConfig = {
    apiKey: "AIzaSyD1SGjQXgfQykrV-psyDDwWbuqfTlE7Zhk",
    authDomain: "cougar2-database.firebaseapp.com",
    databaseURL: "https://cougar2-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cougar2-database",
    storageBucket: "cougar2-database.firebasestorage.app",
    messagingSenderId: "429808185249",
    appId: "1:429808185249:web:4afa08e0a7a973b00d25e0"
};

// 3. เริ่มต้นใช้งาน Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const itemsRef = ref(db, 'cougar_data');

let state = {
    items: [],
    isGlobalLocked: JSON.parse(localStorage.getItem('global_lock')) || false,
    isAdmin: sessionStorage.getItem('isAdmin') === 'true'
};

// 4. ดึงข้อมูลจาก Cloud แบบ Real-time
onValue(itemsRef, (snapshot) => {
    const data = snapshot.val();
    state.items = data ? data : [];
    renderItems();
    updateDashboard();
});

// --- ฟังก์ชันจัดการข้อมูล (ต้องใส่ window. เพื่อให้ HTML มองเห็น) ---

window.saveItem = function() {
    const index = parseInt(document.getElementById('editIndex').value);
    const newItem = {
        name: document.getElementById('itemName').value,
        img: document.getElementById('itemImg').value,
        link: document.getElementById('itemLink').value,
        locked: index > -1 ? state.items[index].locked : false
    };

    if (newItem.name && newItem.link) {
        if (index > -1) state.items[index] = newItem;
        else state.items.push(newItem);

        set(itemsRef, state.items); // ส่งขึ้น Cloud
        resetForm();
    } else {
        alert("กรุณากรอกข้อมูลให้ครบ");
    }
};

window.deleteItem = function(index) {
    if(confirm("ต้องการลบ?")) {
        state.items.splice(index, 1);
        set(itemsRef, state.items);
    }
};

window.toggleItemLock = function(index) {
    state.items[index].locked = !state.items[index].locked;
    set(itemsRef, state.items);
};

window.toggleGlobalLock = function() {
    state.isGlobalLocked = document.getElementById('globalLock').checked;
    localStorage.setItem('global_lock', state.isGlobalLocked);
    renderItems();
};

// --- ฟังก์ชันแสดงผล ---

function renderItems() {
    const list = document.getElementById('download-list');
    let htmlBuffer = '';
    
    state.items.forEach((item, index) => {
        const isLocked = state.isGlobalLocked || item.locked;
        htmlBuffer += `
            <div class="download-card">
                <div class="card-img-container" onclick="window.openImage('${item.img}')">
                    <img src="${item.img || 'https://via.placeholder.com/300x160?text=No+Image'}" loading="lazy">
                </div>
                <div class="download-info">
                    <h4>${item.name}</h4>
                    <button onclick="window.secureDownload('${item.link}', ${item.locked})" class="btn-download ${isLocked ? 'is-locked' : 'is-open'}">
                        <i class="fas ${isLocked ? 'fa-lock' : 'fa-download'}"></i> 
                        ${isLocked ? 'Password Required' : 'Download Now'}
                    </button>
                </div>
                ${state.isAdmin ? `
                    <div class="admin-controls">
                        <label class="switch"><input type="checkbox" ${item.locked ? 'checked' : ''} onchange="window.toggleItemLock(${index})"><span class="slider"></span></label>
                        <button onclick="window.editItem(${index})" class="admin-btn-text" style="color:var(--primary);"><i class="fas fa-edit"></i> Edit</button>
                        <button onclick="window.deleteItem(${index})" class="admin-btn-text" style="color:var(--danger);"><i class="fas fa-trash"></i> Delete</button>
                    </div>` : ''}
            </div>`;
    });
    list.innerHTML = htmlBuffer;
}

// ฟังก์ชันอื่นๆ ที่จำเป็น (Helper Functions)
window.editItem = function(index) {
    const item = state.items[index];
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemImg').value = item.img;
    document.getElementById('itemLink').value = item.link;
    document.getElementById('editIndex').value = index;
    document.getElementById('btn-save').innerText = "Update";
    window.scrollTo({top: 0, behavior: 'smooth'});
};

window.openImage = function(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('imgLightbox').style.display = 'flex';
};

function resetForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemImg').value = '';
    document.getElementById('itemLink').value = '';
    document.getElementById('editIndex').value = '-1';
    document.getElementById('btn-save').innerText = "บันทึก";
}

function updateDashboard() {
    const timeVal = document.getElementById('dash-time');
    if(timeVal) {
        const now = new Date();
        timeVal.innerText = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    }
    const countVal = document.getElementById('dash-count');
    if(countVal) countVal.innerText = state.items.length + " รายการ";
}

window.showPage = function(pageId) {
    document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.sidebar a').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + pageId.split('-')[0]).classList.add('active');
};

// Login Logic (ตัวอย่างคร่าวๆ)
window.toggleAuth = function() {
    if (state.isAdmin) {
        if(confirm("Logout Admin?")) {
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
    if (u === "admin" && p === "admin2") {
        sessionStorage.setItem('isAdmin', 'true');
        location.reload();
    } else {
        alert("รหัสผิด");
    }
};

// เรียกใช้งาน Dashboard เบื้องต้น
setInterval(updateDashboard, 1000);
