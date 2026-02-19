// รายชื่อผู้ที่มีสิทธิ์เข้าใช้งาน
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
        // ใช้ localStorage เพื่อให้ระบบจำการล็อกอินไว้ตลอด
        localStorage.setItem("isLoggedIn", "true");
        window.location.href = "main.html"; 
    } else {
        msg.style.color = "red";
        msg.innerText = "ไอดีหรือรหัสผ่านไม่ถูกต้อง!";
    }
}

// ฟังก์ชันสลับหน้า (สำหรับหน้า main.html)
function showPage(pageId) {
    const livePage = document.getElementById('live-page');
    const calPage = document.getElementById('calendar-page');
    const navLive = document.getElementById('nav-live');
    const navCal = document.getElementById('nav-cal');

    // ตรวจสอบก่อนว่ามี Element เหล่านี้จริงไหมเพื่อป้องกัน Error
    if (livePage && calPage) {
        livePage.style.display = 'none';
        calPage.style.display = 'none';
        document.getElementById(pageId).style.display = 'block';
    }

    if (navLive && navCal) {
        navLive.classList.remove('active');
        navCal.classList.remove('active');
        if(pageId === 'live-page') navLive.classList.add('active');
        if(pageId === 'calendar-page') navCal.classList.add('active');
    }
}
