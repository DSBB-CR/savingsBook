const API = "/api";

const form = document.getElementById("op-form");
const opsBody = document.querySelector("#ops-table tbody");
const portBody = document.querySelector("#portfolio-table tbody");
const opsCount = document.getElementById("ops-count");
const portCount = document.getElementById("portfolio-count");
const toastEl = document.getElementById("toast");

let toastTimer = null;

// ---------- утилиты ----------
function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
        day: "2-digit", month: "2-digit", year: "2-digit",
        hour: "2-digit", minute: "2-digit",
    });
}

function fmtNum(n, digits = 2) {
    return Number(n).toLocaleString("ru-RU", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;",
    }[c]));
}

function toast(msg, kind = "") {
    toastEl.textContent = msg;
    toastEl.className = "toast show " + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
}

// ---------- загрузка ----------
async function loadOperations() {
    const res = await fetch(`${API}/operations`);
    const ops = await res.json();

    opsCount.textContent = ops.length;
    opsBody.innerHTML = "";

    if (!ops.length) {
        opsBody.innerHTML = `<tr><td colspan="8" class="empty">Операций пока нет</td></tr>`;
        return;
    }

    for (const op of ops) {
        const tr = document.createElement("tr");
        const sideClass = op.side === "buy" ? "side-buy" : "side-sell";
        const sideText = op.side === "buy" ? "Покупка" : "Продажа";

        tr.innerHTML = `
            <td>${fmtDate(op.date)}</td>
            <td class="ticker">${escapeHtml(op.ticker)}</td>
            <td><span class="${sideClass}">${sideText}</span></td>
            <td class="num">${fmtNum(op.quantity, 4)}</td>
            <td class="num">${fmtNum(op.price)}</td>
            <td class="num">${fmtNum(op.commission)}</td>
            <td class="note">${escapeHtml(op.note)}</td>
            <td><button class="btn-del" data-id="${op.id}" title="Удалить">✕</button></td>
        `;
        opsBody.appendChild(tr);
    }

    opsBody.querySelectorAll(".btn-del").forEach(btn => {
        btn.addEventListener("click", () => deleteOperation(btn.dataset.id));
    });
}

async function loadPortfolio() {
    const res = await fetch(`${API}/portfolio`);
    const positions = await res.json();

    portCount.textContent = positions.length;
    portBody.innerHTML = "";

    if (!positions.length) {
        portBody.innerHTML = `<tr><td colspan="4" class="empty">Портфель пуст</td></tr>`;
        return;
    }

    for (const p of positions) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="ticker">${escapeHtml(p.ticker)}</td>
            <td class="num">${fmtNum(p.quantity, 4)}</td>
            <td class="num">${fmtNum(p.avg_price)}</td>
            <td class="num">${fmtNum(p.invested)}</td>
        `;
        portBody.appendChild(tr);
    }
}

async function refresh() {
    await Promise.all([loadOperations(), loadPortfolio()]);
}

// ---------- действия ----------
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const payload = {
        date: fd.get("date") ? new Date(fd.get("date")).toISOString() : null,
        ticker: fd.get("ticker").trim(),
        side: fd.get("side"),
        quantity: parseFloat(fd.get("quantity")),
        price: parseFloat(fd.get("price")),
        commission: parseFloat(fd.get("commission") || 0),
        note: fd.get("note").trim(),
    };

    const res = await fetch(`${API}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast("Ошибка: " + (err.detail ? JSON.stringify(err.detail) : res.statusText), "error");
        return;
    }

    form.reset();
    // снова проставим текущее время в поле даты
    setDefaultDate();
    toast("Операция добавлена", "success");
    await refresh();
});

async function deleteOperation(id) {
    if (!confirm("Удалить операцию?")) return;
    const res = await fetch(`${API}/operations/${id}`, { method: "DELETE" });
    if (!res.ok) {
        toast("Не удалось удалить", "error");
        return;
    }
    toast("Удалено", "success");
    await refresh();
}

// ---------- init ----------
function setDefaultDate() {
    const input = form.querySelector('input[name="date"]');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    input.value = now.toISOString().slice(0, 16);
}

setDefaultDate();
refresh();