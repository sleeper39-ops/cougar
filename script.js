import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD1SGjQXgfQykrV-psyDDwWbuqfTlE7Zhk",
    authDomain: "cougar2-database.firebaseapp.com",
    databaseURL: "https://cougar2-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cougar2-database",
    storageBucket: "cougar2-database.firebasestorage.app",
    messagingSenderId: "429808185249",
    appId: "1:429808185249:web:4afa08e0a7a973b00d25e0",
    measurementId: "G-VKV5NP9BFX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const itemsRef = ref(db, 'cougar_data');

let state = {
    items: [],
    isAdmin: sessionStorage.getItem('isAdmin') === 'true'
};

// --- 1. การดึงข้อมูล (Real-time Sync) ---
// บังคับให้ดึงจาก Server เสมอ
onValue(itemsRef, (snapshot) => {
    const data = snapshot.val();
    console.log("📡 ข้อมูลจาก Cloud อัปเดตแล้ว:", data);
    
    // ตรวจสอบข้อมูล: ถ้าบน Cloud เป็น null ต้องแสดงเป็นลิสต์ว่าง
    state.items = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
    
    window.renderItems();
    window.updateDashboard();
}, (error) => {
    console.error("❌ Firebase Sync Error:", error);
    if (error.code === 'PERMISSION_DENIED') {
        alert("⚠️ เครื่องนี้ไม่มีสิทธิ์อ่านข้อมูล! กรุณาเช็ก Rules ใน Firebase");
    }
});

// --- 2. การบันทึกข้อมูล (Force Write to Cloud) ---
window.saveItem = async function() {
    const nameEl = document.getElementById('itemName');
    const linkEl = document.getElementById('itemLink');
    const imgEl = document.getElementById('itemImg');
    const indexEl = document.getElementById('editIndex');

    if (!nameEl || !linkEl) return;

    const name = nameEl.value.trim();
    const link = linkEl.value.trim();
    const img = imgEl.value.trim() || 'https://via.placeholder.com/300x180?text=No+Image';
    const index = parseInt(indexEl.value || "-1");

    if (name && link) {
        let updatedItems = [...state.items];
        const itemData = { name, link, img, locked: false };

        if (index > -1) updatedItems[index] = itemData;
        else updatedItems.push(itemData);

        try {
            // ใช้ await เพื่อรอให้ส่งข้อมูลสำเร็จจริงๆ
            await set(itemsRef, updatedItems);
            console.log("✅ Data sent to Cloud successfully!");
            alert("✅ บันทึกสำเร็จ! ตอนนี้ทุกเครื่องจะเห็นข้อมูลแล้ว");
            window.resetForm();
        } catch (err) {
            console.error("🔥 Save Error:", err);
            // แจ้งสาเหตุที่แท้จริง
            if (err.code === 'PERMISSION_DENIED') {
                alert("❌ บันทึกไม่ได้! เพราะ 'Rules' ใน Firebase ยังไม่ได้กด Publish");
            } else {
                alert("❌ บันทึกไม่สำเร็จ: " + err.message);
            }
        }
    } else {
        alert("กรุณากรอกชื่อและลิงก์");
    }
};

// --- 3. ส่วนการแสดงผล (UI) ---
window.renderItems = function() {
    const list = document.getElementById('download-list');
    if (!list) return;
    
    if (state.items.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:gray;">ไม่มีข้อมูลในระบบ (Cloud is empty)</p>';
        return;
    }

    list.innerHTML = state.items.map((item, index) => `
        <div class="download-card">
            <div class="card-img-container">
                <img src="${item.img}" onerror="this.src='https://via.placeholder.com/300x180?text=Error'">
            </div>
            <div class="download-info">
                <h4>${item.name}</h4>
                <button onclick="window.open('${item.link}', '_blank')" class="btn-download is-open">Download</button>
            </div>
            ${state.isAdmin ? `
                <div class="admin-controls" style="padding:10px; border-top:1px solid #eee;">
                    <button onclick="window.editItem(${index})" style="color:blue; background:none; border:none; cursor:pointer;">Edit</button>
                    <button onclick="window.deleteItem(${index})" style="color:red; background:none; border:none; cursor:pointer; margin-left:10px;">Delete</button>
                </div>` : ''}
        </div>
    `).join('');
};

// --- 4. ฟังก์ชันเสริมอื่นๆ ---
window.deleteItem = async function(index) {
    if (confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) {
        let updatedItems = [...state.items];
        updatedItems.splice(index, 1);
        try {
            await set(itemsRef, updatedItems);
        } catch (err) {
            alert("ลบไม่สำเร็จ: " + err.message);
        }
    }
};

window.editItem = function(index) {
    const item = state.items[index];
    if (item) {
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemLink').value = item.link;
        document.getElementById('itemImg').value = item.img;
        document.getElementById('editIndex').value = index;
        document.getElementById('btn-save').innerText = "Update Data";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.updateDashboard = function() {
    const countEl = document.getElementById('dash-count');
    if (countEl) countEl.innerText = `${state.items.length} รายการ`;
    const statusEl = document.getElementById('dash-status');
    if (statusEl) statusEl.innerText = state.isAdmin ? "Admin Mode" : "Guest Mode";
};

window.resetForm = function() {
    ['itemName', 'itemLink', 'itemImg'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    const idxEl = document.getElementById('editIndex');
    if(idxEl) idxEl.value = '-1';
    const btn = document.getElementById('btn-save');
    if(btn) btn.innerText = "บันทึก";
};

window.performLogin = function() {
    const u = document.getElementById('loginUser')?.value;
    const p = document.getElementById('loginPass')?.value;
    if (u === "admin" && p === "admin2") {
        sessionStorage.setItem('isAdmin', 'true');
        location.reload();
    } else { alert("Login Failed!"); }
};
