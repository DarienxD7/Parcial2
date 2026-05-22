const API_BASE = "https://team-404-grupo-4-del-integrante-jhamel.onrender.com";

const tabla    = document.querySelector("table");
const btnNuevo     = document.querySelectorAll(".botones button")[0];
const btnEditar    = document.querySelectorAll(".botones button")[1];
const btnEliminar  = document.querySelectorAll(".botones button")[2];
const btnSeleccionar = document.querySelectorAll(".botones button")[3];
const btnSalir     = document.querySelectorAll(".botones button")[4];

let filaSeleccionada = null;
let datos = [];

async function cargarOficinas() {
    try {
        const res = await fetch(`${API_BASE}/api/oficina`);
        if (!res.ok) throw new Error("Error al cargar");
        datos = await res.json();
        renderTabla(datos);
    } catch (err) {
        console.warn("Error:", err.message);
    }
}

function renderTabla(data) {
    const filas = tabla.querySelectorAll("tr:not(:first-child)");
    filas.forEach(f => f.remove());

    if (!data || data.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="3" style="text-align:center;color:gray;">No hay registros.</td>`;
        tabla.appendChild(tr);
        return;
    }

    data.forEach(oficina => {
        const tr = document.createElement("tr");
        tr.dataset.id = oficina.id;
        tr.innerHTML = `
            <td style="padding:8px">${oficina.nombre ?? "-"}</td>
            <td style="padding:8px">${oficina.descripcion ?? "-"}</td>
            <td style="padding:8px">${oficina.estado ?? "-"}</td>
        `;
        tr.addEventListener("click", () => {
            document.querySelectorAll("table tr").forEach(r => r.style.background = "");
            tr.style.background = "#cce0ff";
            filaSeleccionada = oficina;
        });
        tabla.appendChild(tr);
    });
}

btnNuevo.addEventListener("click", () => {
    const nombre      = prompt("Nombre (Unidad):");
    if (!nombre) return;
    const descripcion = prompt("Descripción:");
    if (!descripcion) return;
    const estado      = prompt("Estado (ACTIVO/INACTIVO):", "ACTIVO");
    if (!estado) return;

    fetch(`${API_BASE}/api/oficina`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, descripcion, estado })
    })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    })
    .then(resultado => {
        alert(`✅ Oficina creada. ID: ${resultado.id}`);
        cargarOficinas();
    })
    .catch(err => alert(`Error: ${err.message}`));
});

btnEditar.addEventListener("click", () => {
    if (!filaSeleccionada) { alert("Selecciona una fila primero."); return; }

    const nombre      = prompt("Nombre:", filaSeleccionada.nombre);
    if (!nombre) return;
    const descripcion = prompt("Descripción:", filaSeleccionada.descripcion);
    if (!descripcion) return;
    const estado      = prompt("Estado:", filaSeleccionada.estado);
    if (!estado) return;

    fetch(`${API_BASE}/api/oficina/${filaSeleccionada.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, descripcion, estado })
    })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    })
    .then(() => {
        alert("✅ Oficina actualizada.");
        filaSeleccionada = null;
        cargarOficinas();
    })
    .catch(err => alert(`Error: ${err.message}`));
});

btnEliminar.addEventListener("click", () => {
    if (!filaSeleccionada) { alert("Selecciona una fila primero."); return; }
    if (!confirm(`¿Eliminar "${filaSeleccionada.nombre}"?`)) return;

    fetch(`${API_BASE}/api/oficina/${filaSeleccionada.id}`, { method: "DELETE" })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        alert("✅ Oficina eliminada.");
        filaSeleccionada = null;
        cargarOficinas();
    })
    .catch(err => alert(`Error: ${err.message}`));
});

btnSeleccionar.addEventListener("click", () => {
    if (!filaSeleccionada) { alert("Selecciona una fila primero."); return; }
    alert(`Seleccionado:\nUnidad: ${filaSeleccionada.nombre}\nDescripción: ${filaSeleccionada.descripcion}\nEstado: ${filaSeleccionada.estado}`);
});

btnSalir.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else window.close();
});

cargarOficinas();