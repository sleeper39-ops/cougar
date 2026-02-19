// รายชื่อผู้ที่มีสิทธิ์เข้าใช้งาน
const users = [
    { id: "admin", pass: "admin2" },
    { id: "user", pass: "user2" }
];

function checkLogin() {
    const userIn = document.getElementById("username").value;
    const passIn = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    // ตรวจสอบข้อมูลใน Array users
    const foundUser = users.find(u => u.id === userIn && u.pass === passIn);

    if (foundUser) {
        // สร้าง Token จำลองไว้ในเครื่องเพื่อให้หน้า main รู้ว่าล็อคอินแล้ว
        sessionStorage.setItem("isLoggedIn", "true");
        // ย้ายไปหน้า main.html
        window.location.href = "main.html"; 
    } else {
        msg.innerText = "ไอดีหรือรหัสผ่านไม่ถูกต้อง!";
    }
}

<script>
function showPage(pageId) {
    // 1. ซ่อนทุกหน้าก่อน
    document.getElementById('live-page').style.display = 'none';
    document.getElementById('calendar-page').style.display = 'none';

    // 2. แสดงเฉพาะหน้าที่กดเลือก
    document.getElementById(pageId).style.display = 'block';

    // 3. เปลี่ยนสีเมนูให้รู้ว่าเลือกหน้านี้อยู่
    document.getElementById('nav-live').classList.remove('active');
    document.getElementById('nav-cal').classList.remove('active');
    
    if(pageId === 'live-page') document.getElementById('nav-live').classList.add('active');
    if(pageId === 'calendar-page') document.getElementById('nav-cal').classList.add('active');
}
</script>
