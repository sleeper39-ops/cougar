import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    set, 
    push, 
    update, 
    remove,
    onValue 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ----------------------
// 1️⃣ Firebase Config
// ----------------------
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

let state = {
    items: [],
    isAdmin: sessionStorage.getItem('isAdmin') === 'true'
};

// ----------------------
// 2️⃣ Realtime Sync
// ----------------------
onValue(itemsRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
        state.items = [];
    } else {
        state.items = Object.entries(data).map(([id, value]) => ({
            id,
            ...value
        }));
    }

    renderItems();
    updateDashboard();
}, (error) => {
    console.error("Firebase Sync Error:", error);
});

// ----------------------
// 3️⃣ Save Item
// ----------------------
window.saveItem = async function () {
    const nameEl = document.getElementById('itemName');
    const linkEl = document.getElementById('itemLink');
    const imgEl = document.getElementById('itemImg');
    const idEl = document.getElementById('editId');

    if (!nameEl || !linkEl) {
        alert("ไม่พบ input field");
        return;
    }

    const name = nameEl.value.trim();
    const link = linkEl.value.trim();
    const img = imgEl?.value.trim() || 'https://via.placeholder.com/300x180?text=No+Image';
    const editId = idEl?.value || "";

    if (!name || !link) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
    }

    const itemData = {
        name,
        link,
        img,
        locked: false,
        createdAt: Date.now()
    };

    try {
        if (editId) {
            // ✏️ Update
            const itemRef = ref(db, 'cougar_data/' + editId);
            await update(itemRef, itemData);
        } else {
            // ➕ Add
            const newRef = push(itemsRef);
            await set(newRef, itemData);
        }

        resetForm();
        alert("บันทึกสำเร็จ ✅");

    } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาด: " + err.message);
    }
};

// ----------------------
// 4️⃣ Render UI
// ----------------------
window.renderItems = function () {
    const list = document.getElementById('download-list');
    if (!list) return;

    if (state.items.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:50px;color:#999;">
            <h3>☁️ ไม่มีข้อมูล</h3>
        </div>`;
        return;
    }

    list.innerHTML = state.items.map((item) => `
        <div class="download-card">
            <div onclick="openImage('${item.img}')">
                <img src="${item.img}" 
                     onerror="this.src='https://via.placeholder.com/300x180?text=Error'">
            </div>

            <div>
                <h4>${item.name}</h4>
                <button onclick="window.open('${item.link}','_blank')">
                    Download
                </button>
            </div>

            ${state.isAdmin ? `
                <div style="margin-top:10px">
                    <button onclick="editItem('${item.id}')">Edit</button>
                    <button onclick="deleteItem('${item.id}')">Delete</button>
                </div>` : ''}
        </div>
    `).join('');
};

// ----------------------
// 5️⃣ Delete
// ----------------------
window.deleteItem = async function (id) {
    if (!confirm("ต้องการลบใช่หรือไม่?")) return;

    try {
        const itemRef = ref(db, 'cougar_data/' + id);
        await remove(itemRef);
    } catch (err) {
        alert("ลบไม่สำเร็จ: " + err.message);
    }
};

// ----------------------
// 6️⃣ Edit
// ----------------------
window.editItem = function (id) {
    const item = state.items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('itemName').value = item.name;
    document.getElementById('itemLink').value = item.link;
    document.getElementById('itemImg').value = item.img;
    document.getElementById('editId').value = item.id;

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ----------------------
// 7️⃣ Reset Form
// ----------------------
window.resetForm = function () {
    ['itemName', 'itemLink', 'itemImg', 'editId'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
};

// ----------------------
// 8️⃣ Dashboard
// ----------------------
window.updateDashboard = function () {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    const timeEl = document.getElementById('dash-time');
    const countEl = document.getElementById('dash-count');

    if (timeEl) timeEl.innerText = timeStr;
    if (countEl) countEl.innerText = state.items.length + " รายการ";
};

// ----------------------
// 9️⃣ Init
// ----------------------
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    setInterval(updateDashboard, 1000);
});
