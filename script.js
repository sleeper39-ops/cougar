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

/* ================= State ================= */
const state = {
    items: []
};

/* ================= Safe Helper ================= */
function safeAsync(fn) {
    return async (...args) => {
        try {
            await fn(...args);
        } catch (err) {
            console.error("Firebase Error:", err);
        }
    };
}

/* ================= Load Realtime ================= */
onValue(ref(db, "cougar_data"), (snapshot) => {
    const data = snapshot.val() || {};
    state.items = Object.keys(data).map(id => ({
        id,
        ...data[id]
    }));
    renderItems();
});

/* ================= Add / Edit ================= */
window.saveItem = safeAsync(async function () {

    const name = document.getElementById("fileName")?.value.trim();
    const image = document.getElementById("imageUrl")?.value.trim();
    const link = document.getElementById("downloadUrl")?.value.trim();
    const editId = document.getElementById("editId")?.value;

    if (!name || !link) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
    }

    if (editId) {
        await update(ref(db, "cougar_data/" + editId), {
            name,
            image,
            link
        });
        document.getElementById("editId").value = "";
    } else {
        const newRef = push(ref(db, "cougar_data"));
        await set(newRef, {
            name,
            image,
            link,
            locked: false
        });
    }

    clearForm();
});

/* ================= Delete ================= */
window.deleteItem = safeAsync(async function (id) {
    if (!confirm("ยืนยันการลบ?")) return;
    await remove(ref(db, "cougar_data/" + id));
});

/* ================= Lock ================= */
window.toggleLock = safeAsync(async function (id, current) {
    await update(ref(db, "cougar_data/" + id), {
        locked: !current
    });
});

/* ================= Render ================= */
function renderItems() {
    const container = document.getElementById("itemsContainer");
    if (!container) return;

    container.innerHTML = "";

    state.items.forEach(item => {

        const card = document.createElement("div");
        card.className = "card";

        const img = item.image && item.image.startsWith("http")
            ? item.image
            : "https://via.placeholder.com/300x180?text=Cougar2";

        card.innerHTML = `
            <img src="${img}" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
            <h4>${item.name}</h4>
            <a href="${item.link}" target="_blank">
                <button ${item.locked ? "disabled" : ""}>
                    ${item.locked ? "Locked" : "Download Now"}
                </button>
            </a>
            <br>
            <button onclick="editItem('${item.id}')">Edit</button>
            <button onclick="deleteItem('${item.id}')">Delete</button>
            <button onclick="toggleLock('${item.id}', ${item.locked})">
                ${item.locked ? "Unlock" : "Lock"}
            </button>
        `;

        container.appendChild(card);
    });
}

/* ================= Edit ================= */
window.editItem = function (id) {
    const item = state.items.find(x => x.id === id);
    if (!item) return;

    document.getElementById("fileName").value = item.name;
    document.getElementById("imageUrl").value = item.image;
    document.getElementById("downloadUrl").value = item.link;
    document.getElementById("editId").value = id;
};

/* ================= Clear ================= */
function clearForm() {
    document.getElementById("fileName").value = "";
    document.getElementById("imageUrl").value = "";
    document.getElementById("downloadUrl").value = "";
}
