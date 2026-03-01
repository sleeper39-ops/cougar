// --- script-upload.js ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzAd-66w6GLXmkvZEQJZ4ZxwFp2gDlIjFvhRWRQ3vLRb_NexG7FxIwqdVmOX5DKPHH0/exec";

// 1. ฟังก์ชันภายในสำหรับจัดการไฟล์ (ส่งไป Google Drive)
const uploadFileToDrive = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
            try {
                const base64Data = e.target.result.split(',')[1];
                const payload = {
                    filename: file.name,
                    mimetype: file.type,
                    base64: base64Data
                };

                const response = await fetch(SCRIPT_URL, {
                    method: "POST",
                    body: JSON.stringify(payload),
                    headers: { "Content-Type": "text/plain;charset=utf-8" }
                });

                const result = await response.json();
                if (result.status === "success" || result.url) {
                    resolve(result.url);
                } else {
                    reject(new Error(result.message || "Upload failed"));
                }
            } catch (error) {
                reject(new Error("เชื่อมต่อ Google Drive ไม่สำเร็จ"));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

// 2. ฟังก์ชันหลักสำหรับปุ่ม Save (เรียกใช้จากหน้าเว็บ)
// รับพารามิเตอร์ที่จำเป็นจากไฟล์หลักมาใช้งาน
export const handleSaveItem = async (db, ref, update, push, isAdmin, items, resetForm) => {
    if (!isAdmin) return;

    const name = document.getElementById('itemName').value;
    const img = document.getElementById('itemImg').value;
    const fileInput = document.getElementById('itemFile');
    let link = document.getElementById('itemLink').value;

    // ส่วนการอัพโหลดไฟล์
    if (fileInput && fileInput.files.length > 0) {
        try {
            const btnSave = document.getElementById('btn-save');
            const originalText = btnSave.innerText;
            btnSave.innerText = "⏳ อัพโหลดไฟล์...";
            btnSave.disabled = true;

            const driveUrl = await uploadFileToDrive(fileInput.files[0]);
            link = driveUrl; 
            
            btnSave.innerText = originalText;
            btnSave.disabled = false;
        } catch (error) {
            alert("❌ อัพโหลดไม่สำเร็จ: " + error.message);
            document.getElementById('btn-save').disabled = false;
            return;
        }
    }

    if (!name || !link) return alert("กรุณาระบุชื่อและไฟล์ (หรือลิงก์)");

    // ส่วนการบันทึกลง Firebase
    const key = document.getElementById('editKey').value;
    const data = { 
        name, img, link, 
        locked: key ? items.find(i => i.key === key).locked : false,
        downloads: key ? (items.find(i => i.key === key).downloads || 0) : 0 
    };

    if(key) await update(ref(db, `cougar_data/${key}`), data);
    else await push(ref(db, "cougar_data"), data);
    
    resetForm();
    if(fileInput) fileInput.value = '';
    alert("✨ บันทึกข้อมูลเรียบร้อย!");
};
