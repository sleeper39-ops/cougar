// 1. ส่วนเก็บข้อมูลผู้ใช้ (เพิ่ม/ลด/แก้ไข ตรงนี้ได้เลย)
const users = [
    { id: "admin", pass: "admin2" },
    { id: "user1", pass: "1234" }, // ตัวอย่างการเพิ่ม ID ใหม่
    { id: "tapo_manager", pass: "parking99" }
];

// 2. ฟังก์ชันตรวจสอบการ Login
function checkLogin() {
    const userIn = document.getElementById("username").value;
    const passIn = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    // ตรวจสอบว่า ID และ Pass ตรงกับในรายการที่มีไหม
    const foundUser = users.find(u => u.id === userIn && u.pass === passIn);

    if (foundUser) {
        // ถ้าถูก ให้ไปหน้า main.html
        window.location.href = "main.html"; 
    } else {
        msg.innerText = "ID หรือ Password ไม่ถูกต้อง!";
    }
}