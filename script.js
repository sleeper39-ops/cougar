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

// ฟังก์ชันบันทึกข้อมูลลง LocalStorage (เพื่อให้ข้อมูลไม่หายเวลา Refresh)
let downloadItems = JSON.parse(localStorage.getItem('myDownloads')) || [];

function renderDownloads() {
    const list = document.getElementById('download-list');
    list.innerHTML = ''; // ล้างค่าเก่า
    
    downloadItems.forEach((item, index) => {
        list.innerHTML += `
            <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #ddd; display: flex; flex-direction: column;">
                <img src="${item.img}" style="width: 100%; height: 200px; object-fit: cover; background: #eee;">
                <div style="padding: 20px; text-align: center;">
                    <h3 style="margin: 0 0 15px 0;">${item.name}</h3>
                    <a href="${item.link}" target="_blank" style="display: block; background: var(--bg-dark); color: white; text-decoration: none; padding: 12px; border-radius: 8px; margin-bottom: 10px; font-weight: bold;">
                        <i class="fas fa-download"></i> ดาวน์โหลดไฟล์
                    </a>
                    <button onclick="deleteItem(${index})" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 12px;">
                        <i class="fas fa-trash"></i> ลบรายการนี้
                    </button>
                </div>
            </div>
        `;
    });
}

function addItem() {
    const name = document.getElementById('itemName').value;
    const img = document.getElementById('itemImg').value;
    const link = document.getElementById('itemLink').value;

    if (name && link) {
        downloadItems.push({ name, img, link });
        localStorage.setItem('myDownloads', JSON.stringify(downloadItems));
        renderDownloads(); // อัปเดตการแสดงผล
        
        // ล้างค่าใน Input
        document.getElementById('itemName').value = '';
        document.getElementById('itemImg').value = '';
        document.getElementById('itemLink').value = '';
    } else {
        alert("กรุณากรอกชื่อและลิงก์ดาวน์โหลด");
    }
}

function deleteItem(index) {
    if(confirm("ยืนยันการลบรายการนี้?")) {
        downloadItems.splice(index, 1);
        localStorage.setItem('myDownloads', JSON.stringify(downloadItems));
        renderDownloads();
    }
}

// เรียกใช้งานครั้งแรกเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', renderDownloads);
