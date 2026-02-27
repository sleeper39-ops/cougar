import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = { /* Config ของคุณ */ };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const itemsRef = ref(db, 'cougar_data');

let state = {
    items: [],
    isAdmin: sessionStorage.getItem('isAdmin') === 'true'
};

// ดึงข้อมูลจาก Cloud มาแสดงผล
onValue(itemsRef, (snapshot) => {
    state.items = snapshot.val() || [];
    renderItems(); // เรียกฟังก์ชันวาดหน้าจอ
});

// ผูกฟังก์ชันเข้ากับ Window เพื่อให้ HTML เรียกใช้งานได้
window.saveItem = function() {
    const name = document.getElementById('itemName').value;
    const link = document.getElementById('itemLink').value;
    const img = document.getElementById('itemImg').value;
    
    state.items.push({ name, link, img, locked: false });
    set(itemsRef, state.items); // บันทึกขึ้น Firebase ทันที!
    // ... ล้างค่าในฟอร์ม ...
};

window.showPage = function(pageId) {
    document.querySelectorAll('.page-content').forEach(el => el.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
};

// ... ใส่ฟังก์ชันอื่นๆ เช่น toggleAuth, performLogin โดยเติม window. นำหน้า ...
