// --- upload-service.js ---

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzAd-66w6GLXmkvZEQJZ4ZxwFp2gDlIjFvhRWRQ3vLRb_NexG7FxIwqdVmOX5DKPHH0/exec";

/**
 * ฟังก์ชันหลักสำหรับอัพโหลดไฟล์ไปที่ Google Drive ผ่าน Apps Script
 * @param {File} file - ไฟล์ที่ได้จาก input[type="file"]
 * @returns {Promise<string>} - คืนค่า URL ดาวน์โหลดตรงจาก Google Drive
 */
export const uploadFileToDrive = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const base64Data = e.target.result.split(',')[1];
                
                const payload = {
                    filename: file.name,
                    mimetype: file.type,
                    base64: base64Data
                };

                // ส่งข้อมูลไปยัง Google Apps Script
                // หมายเหตุ: ต้องใช้ Method POST และส่งแบบ stringify
                const response = await fetch(SCRIPT_URL, {
                    method: "POST",
                    body: JSON.stringify(payload),
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8",
                    },
                });

                const result = await response.json();

                if (result.status === "success" || result.url) {
                    resolve(result.url); // คืนค่าลิงก์ Google Drive
                } else {
                    reject(new Error(result.message || "การอัพโหลดล้มเหลว"));
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                reject(new Error("ไม่สามารถเชื่อมต่อกับ Google Apps Script ได้"));
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file); // เริ่มอ่านไฟล์เป็น Base64
    });
};
