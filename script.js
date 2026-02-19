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
