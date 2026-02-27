
/* ================= Firebase Config ================= */
const firebaseConfig = {
    apiKey: "AIzaSyD1SGjQXgfQykrV-psyDDwWbuqfTlE7Zhk",
    authDomain: "cougar2-database.firebaseapp.com",
    databaseURL: "https://cougar2-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cougar2-database",
    storageBucket: "cougar2-database.firebasestorage.app",
    messagingSenderId: "429808185249",
    appId: "1:429808185249:web:4afa08e0a7a973b00d25e0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let items = [];
let isAdmin = false;

/* ================= Clock ================= */
setInterval(() => {
    const now = new Date();
    document.getElementById("dash-time").innerText =
        now.toLocaleTimeString("th-TH");
}, 1000);

/* ================= Realtime Load ================= */
onValue(ref(db, "cougar_data"), (snapshot) => {
    const data = snapshot.val() || {};
    items = Object.keys(data).map(id => ({
        id,
        ...data[id]
    }));

    renderItems();
    document.getElementById("dash-count").innerText =
        items.length + " รายการ";
});

/* ================= Render ================= */
function renderItems() {
    const container = document.getElementById("download-list");
    container.innerHTML = "";

    items.forEach(item => {

        const imgSrc = item.image && item.image.startsWith("http")
            ? item.image
            : "https://via.placeholder.com/300x180?text=Cougar2";

        const card = document.createElement("div");
        card.className = "download-card";

        card.innerHTML = `
        <div class="card-img-container"
            onclick="window.openLightbox('${imgSrc}')">
            <img src="${imgSrc}"
             onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
        </div>

        <div class="download-info">
            <h4>${item.name}</h4>
            <button class="btn-download is-open"
                ${item.locked ? "disabled" : ""}
                onclick="window.openLink('${item.link}')">
                ${item.locked ? "Locked" : "Download Now"}
            </button>
        </div>

        ${isAdmin ? `
        <div class="admin-controls">
            <button class="admin-btn-text"
                onclick="window.editItem('${item.id}')">Edit</button>
            <button class="admin-btn-text"
                onclick="window.deleteItem('${item.id}')">Delete</button>
            <button class="admin-btn-text"
                onclick="window.toggleLock('${item.id}', ${item.locked})">
                ${item.locked ? "Unlock" : "Lock"}
            </button>
        </div>` : ""}
        `;

        container.appendChild(card);
    });
}

/* ================= Add / Edit ================= */
window.saveItem = async function () {

    try {
        const name = document.getElementById("itemName").value.trim();
        const image = document.getElementById("itemImg").value.trim();
        const link = document.getElementById("itemLink").value.trim();
        const editId = document.getElementById("editId").value;

        if (!name || !link) {
            alert("กรอกข้อมูลให้ครบ");
            return;
        }

        if (editId) {
            await update(ref(db, "cougar_data/" + editId), {
                name,
                image,
                link
            });
        } else {
            const newRef = push(ref(db, "cougar_data"));
            await set(newRef, {
                name,
                image,
                link,
                locked: false
            });
        }

        resetForm();

    } catch (err) {
        console.error(err);
    }
};

/* ================= Edit ================= */
window.editItem = function (id) {
    const item = items.find(x => x.id === id);
    if (!item) return;

    document.getElementById("itemName").value = item.name;
    document.getElementById("itemImg").value = item.image || "";
    document.getElementById("itemLink").value = item.link;
    document.getElementById("editId").value = id;
};

/* ================= Delete ================= */
window.deleteItem = async function (id) {
    if (!confirm("ยืนยันลบ?")) return;
    await remove(ref(db, "cougar_data/" + id));
};

/* ================= Lock ================= */
window.toggleLock = async function (id, current) {
    await update(ref(db, "cougar_data/" + id), {
        locked: !current
    });
};

/* ================= Reset ================= */
window.resetForm = function () {
    document.getElementById("itemName").value = "";
    document.getElementById("itemImg").value = "";
    document.getElementById("itemLink").value = "";
    document.getElementById("editId").value = "";
};

/* ================= Lightbox ================= */
window.openLightbox = function (src) {
    document.getElementById("lightboxImg").src = src;
    document.getElementById("imgLightbox").style.display = "flex";
};

/* ================= Open Link ================= */
window.openLink = function (url) {
    window.open(url, "_blank");
};

/* ================= Auth ================= */
window.toggleAuth = function () {
    document.getElementById("loginModal").style.display = "flex";
};

window.performLogin = function () {
    const user = document.getElementById("loginUser").value;
    const pass = document.getElementById("loginPass").value;

    if (user === "admin" && pass === "1234") {
        isAdmin = true;
        document.getElementById("admin-panel").style.display = "block";
        document.getElementById("dash-status").innerText = "Admin Mode";
        document.getElementById("loginModal").style.display = "none";
        renderItems();
    } else {
        alert("รหัสไม่ถูกต้อง");
    }
};
