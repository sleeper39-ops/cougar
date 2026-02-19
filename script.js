// === ส่วนของหน้า Login (index.html) ===
const users = [
    { id: "admin", pass: "admin2" },
    { id: "user", pass: "user2" }
];

function checkLogin() {
    const userIn = document.getElementById("username").value;
    const passIn = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    const foundUser = users.find(u => u.id === userIn && u.pass === passIn);
    if (foundUser) {
        localStorage.setItem("isLoggedIn", "true");
        window.location.href = "main.html"; 
    } else {
        msg.style.color = "red";
        msg.innerText = "ไอดีหรือรหัสผ่านไม่ถูกต้อง!";
    }
}

// === ส่วนของหน้าหลัก (main.html) ===
function showPage(pageId) {
    // 1. จัดการการแสดงผลหน้า
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(p => p.style.display = 'none');
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.style.display = 'block';

    // 2. จัดการสีเมนู (เช็ค ID ให้ตรงกับ HTML ของคุณ)
    const btnLive = document.getElementById('btn-live');
    const btnCal = document.getElementById('btn-cal');

    if (btnLive && btnCal) {
        btnLive.classList.remove('active');
        btnCal.classList.remove('active');
        if(pageId === 'live-page') btnLive.classList.add('active');
        if(pageId === 'calendar-page') btnCal.classList.add('active');
    }
}

// ฟังก์ชันบันทึกกิจกรรม (ใช้ร่วมกับ Google Apps Script)
async function addEvent() {
    const url = "https://script.google.com/macros/s/AKfycbzJirF7Ldstah4LZepPRCGWmnoPSDnLGv0KvFb3bac-bvh8iLLxMdUH0Tc5EmIAz_c/exec"; 
    const title = document.getElementById('eventTitle').value;
    const start = document.getElementById('eventStart').value;
    const end = document.getElementById('eventEnd').value;
    const msg = document.getElementById('statusMsg');

    if (!title || !start || !end) return alert("กรอกข้อมูลไม่ครบ");

    msg.innerText = "⏳ กำลังบันทึก...";
    try {
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ title, start, end })
        });
        msg.innerText = "✅ สำเร็จ! รออัปเดตปฏิทิน...";
        setTimeout(() => {
            document.querySelector('iframe').src += ""; // รีเฟรชปฏิทิน
            msg.innerText = "";
        }, 2000);
    } catch (e) {
        msg.innerText = "❌ ผิดพลาด: " + e.message;
    }
}

