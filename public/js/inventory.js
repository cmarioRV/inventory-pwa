import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const meEl = document.getElementById("me");

const inventorySection = document.getElementById("inventory");
const itemSelect = document.getElementById("itemSelect");
const typeSelect = document.getElementById("typeSelect");
const qtyInput = document.getElementById("qtyInput");
const noteInput = document.getElementById("noteInput");
const saveMovementBtn = document.getElementById("saveMovementBtn");
const refreshStockBtn = document.getElementById("refreshStockBtn");
const stockList = document.getElementById("stockList");

let currentUser = null;
let itemsCache = []; // [{id, name, unit}]

loginBtn.addEventListener("click", async () => {
  await signInWithEmailAndPassword(auth, emailEl.value.trim(), passEl.value);
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) {
    meEl.textContent = "";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    inventorySection.style.display = "none";
    return;
  }

  meEl.textContent = `Logueado: ${user.email}`;
  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";
  inventorySection.style.display = "block";

  await loadItems();
  await refreshStock();
});

async function loadItems() {
  itemSelect.innerHTML = "";
  itemsCache = [];

  const itemsSnap = await getDocs(collection(db, "Goods"));
  itemsSnap.forEach((doc) => {
    const data = doc.data();
    if (data.isActive === false) return;
    itemsCache.push({ id: doc.id, name: data.name, unit: data.unit });

    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = `${data.name} (${data.unit})`;
    itemSelect.appendChild(opt);
  });
}

saveMovementBtn.addEventListener("click", async () => {
  if (!currentUser) return;

  const itemId = itemSelect.value;
  const type = typeSelect.value;
  const qty = Number(qtyInput.value);
  const note = noteInput.value.trim();

  if (!itemId) return alert("Selecciona un insumo");
  if (!Number.isFinite(qty) || qty === 0) return alert("Cantidad inválida (no puede ser 0)");

  const item = itemsCache.find((i) => i.id === itemId);
  if (!item) return alert("Ítem no encontrado");

  await addDoc(collection(db, "Movements"), {
    storeId: "main",
    itemId,
    type,
    qty,
    unit: item.unit,
    note,
    createdBy: currentUser.uid
    // createdAt: server timestamp (lo pones luego si quieres, con serverTimestamp())
  });

  qtyInput.value = "";
  noteInput.value = "";
  await refreshStock();
});

refreshStockBtn.addEventListener("click", refreshStock);

async function refreshStock() {
  stockList.innerHTML = "";

  // Inicializa stock por item
  const totals = new Map(); // itemId -> number
  itemsCache.forEach((it) => totals.set(it.id, 0));

  // Trae todos los movimientos (MVP). Luego filtramos por fechas/paginación si crece.
  const movSnap = await getDocs(
    query(collection(db, "Movements"), where("storeId", "==", "main"))
  );

  movSnap.forEach((doc) => {
    const m = doc.data();
    const current = totals.get(m.itemId) ?? 0;
    let delta = Number(m.qty) || 0;

    // Opción A:
    // - in: suma
    // - out: resta (si qty viene positivo)
    // - adjust: se usa tal cual (puede ser + o -)
    if (m.type === "out") delta = -Math.abs(delta);
    if (m.type === "in") delta = Math.abs(delta);

    totals.set(m.itemId, current + delta);
  });

  // Render
  itemsCache.forEach((it) => {
    const li = document.createElement("li");
    const qty = totals.get(it.id) ?? 0;
    li.textContent = `${it.name}: ${qty} ${it.unit}`;
    stockList.appendChild(li);
  });
}