const API = "/api";

const form = document.getElementById("op-form");
const opsBody = document.querySelector("#ops-table tbody");
const portBody = document.querySelector("#portfolio-table tbody");

// ---------- утилиты ----------
function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
}
function fmtNum(n, digits = 2) {
    return Number(n).toLocaleString("ru-RU", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// ---------- загрузка ----------
async function loadOperations() {
    const res = await fetch(`${API}/operations`);
    const ops = await res.json();
    opsBody.innerHTML = "";

    for (const op of ops) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${fmtDate(op.date)}</td>
            <td>${op.ticker}</td>
            <td class="${op.side === 'buy' ? 'side-buy' : 'side-sell'}">
                ${op.side === 'buy' ? 'Покупка' : 'Продажа'}
            </td>
            <td>${fmtNum(op.quantity, 4)}</td>
            <td>${fmtNum(op.price)}</td>
            <td>${fmtNum(op.commission)}</td>
            <td>${op.note || ""}</td>
            <td><button class="btn-del" data-id="${op.id}">✕</button></td>
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
    portBody.innerHTML = "";

    if (!positions.length) {
        portBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#999">Пусто</td></tr>`;
        return;
    }

    for (const p of positions) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.ticker}</td>
            <td>${fmtNum(p.quantity, 4)}</td>
            <td>${fmtNum(p.avg_price)}</td>
            <td>${fmtNum(p.invested)}</td>
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
        ticker: fd.get("ticker"),
        side: fd.get("side"),
        quantity: parseFloat(fd.get("quantity")),
        price: parseFloat(fd.get("price")),
        commission: parseFloat(fd.get("commission") || 0),
        note: fd.get("note") || "",
    };

    const res = await fetch(`${API}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json();
        alert("Ошибка: " + JSON.stringify(err.detail));
        return;
    }

    form.reset();
    await refresh();
});

async function deleteOperation(id) {
    if (!confirm("Удалить операцию?")) return;
    await fetch(`${API}/operations/${id}`, { method: "DELETE" });
    await refresh();
}

// ---------- init ----------
refresh();