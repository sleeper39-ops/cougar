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

// ฟังก์ชันสำหรับรับค่าจากหน้าเว็บมาบันทึกในปฏิทิน
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // ใส่ ID ปฏิทินของคุณ (หาได้จาก Settings ใน Google Calendar)
    var calendarId = "0862ce80073c1952685942ed711afe8838017aeda13bd78dd57f561929e4b083@group.calendar.google.com";
    var calendar = CalendarApp.getCalendarById(calendarId);
    
    // สร้างกิจกรรม: (หัวข้อ, วันที่เริ่ม, วันที่สิ้นสุด)
    calendar.createEvent(data.title, new Date(data.start), new Date(data.end));
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
           .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
           .setMimeType(ContentService.MimeType.JSON);
  }
}
