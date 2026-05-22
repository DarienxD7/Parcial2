// ============================================================
//  Administración Unidad Administrativa — script.js
//  API: VSIAF · Spring Boot · PostgreSQL
// ============================================================

const API_BASE_URL = "http://localhost:8080/api/departamentos";


const DEMO_DEPARTAMENTOS = [
    { id: 1, descripcion: "GACETA OFICIAL DE BOLIVIA", ciudad: "LA PAZ" },
    { id: 2, descripcion: "MINISTERIO DE ECONOMÍA",    ciudad: "LA PAZ" },
    { id: 3, descripcion: "CONTRALORÍA DEL ESTADO",    ciudad: "COCHABAMBA" },
    { id: 4, descripcion: "BANCO CENTRAL DE BOLIVIA",  ciudad: "LA PAZ" },
    { id: 5, descripcion: "ADUANA NACIONAL",           ciudad: "SANTA CRUZ" }
];
let demoData   = JSON.parse(JSON.stringify(DEMO_DEPARTAMENTOS));
let demoNextId = 6;
let modoDemo   = false;


async function apiFetch(url, options = {}) {
    const config = {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers }
    };
    const response = await fetch(url, config);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.status === 204) return null;
    return response.json();
}

function mostrarEstado(msg, tipo = "info") {
    const colores = { info: "#0f3d67", ok: "#155724", error: "#721c24", warn: "#856404", demo: "#5a3e8c" };
    const fondo   = { info: "#dce8f5", ok: "#d4edda",  error: "#f8d7da",  warn: "#fff3cd", demo: "#ede8f7" };
    let b = document.getElementById("status-bar");
    if (!b) {
        b = document.createElement("div");
        b.id = "status-bar";
        Object.assign(b.style, { padding:"6px 12px", fontSize:"13px", fontWeight:"bold",
            borderTop:"1px solid #ccc", transition:"opacity 0.3s" });
        document.querySelector(".content-container")?.appendChild(b);
    }
    b.textContent = msg;
    b.style.color      = colores[tipo] || colores.info;
    b.style.background = fondo[tipo]   || fondo.info;
    b.style.opacity    = "1";
    clearTimeout(b._t);
    if (tipo !== "error") b._t = setTimeout(() => { b.style.opacity = "0"; }, 3500);
}


const edicion = { activo: false, id: null };


document.addEventListener("DOMContentLoaded", () => {
    cargarDepartamentos();
    document.querySelector(".control-panel")?.addEventListener("click", (e) => {
        if (!e.target.classList.contains("nav-btn")) return;
        switch (e.target.textContent.trim()) {
            case "Nuevo":       mostrarFormularioNuevo(); break;
            case "Guardar":     guardarNuevoDepartamento(); break;
            case "Editar":      activarEdicion();         break;
            case "Confirmar":   guardarEdicion();         break;
            case "Eliminar":    confirmarEliminar();      break;
            case "Seleccionar": seleccionarFila();        break;
            case "Salir":
                if (confirm("¿Desea cerrar la ventana?")) window.close();
                break;
        }
    });
});


async function cargarDepartamentos() {
    const tbody = document.querySelector(".data-grid tbody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888">Cargando...</td></tr>`;

    try {
        const datos = await apiFetch(API_BASE_URL);
        modoDemo = false;
        renderizarTabla(tbody, datos);
        mostrarEstado(`${datos.length} departamento(s) cargado(s).`, "ok");
    } catch {
        modoDemo = true;
        demoData = JSON.parse(JSON.stringify(DEMO_DEPARTAMENTOS));
        renderizarTabla(tbody, demoData);
        mostrarEstado("★ MODO DEMO — Spring Boot no disponible. Datos de ejemplo.", "demo");
    }
}

function renderizarTabla(tbody, lista) {
    tbody.innerHTML = "";
    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888">Sin registros</td></tr>`;
        return;
    }
    lista.forEach((d, i) => tbody.appendChild(crearFila(d, i === 0)));
}

function crearFila(dept, activa = false) {
    const f = document.createElement("tr");
    f.dataset.id          = dept.id;
    f.dataset.descripcion = dept.descripcion || "";
    f.dataset.ciudad      = dept.ciudad || "";
    if (activa) f.classList.add("active-row");
    f.innerHTML = `<td>${dept.id}</td><td>${dept.descripcion||""}</td><td>${dept.ciudad||""}</td>`;
    f.addEventListener("click", () => {
        document.querySelectorAll(".data-grid tbody tr").forEach(r => r.classList.remove("active-row"));
        f.classList.add("active-row");
        edicion.id = dept.id;
        mostrarEstado(`Seleccionado: [${dept.id}] ${dept.descripcion}`, "info");
    });
    return f;
}


function mostrarFormularioNuevo() {
    if (document.getElementById("fila-nueva")) {
        document.getElementById("inp-desc")?.focus(); return;
    }
    const tbody = document.querySelector(".data-grid tbody");
    const fila = document.createElement("tr");
    fila.id = "fila-nueva";
    fila.innerHTML = `
        <td style="color:#888;font-style:italic">Auto</td>
        <td><input id="inp-desc" type="text" placeholder="Descripción" maxlength="100"
            style="width:95%;padding:3px;border:1px solid #4a7ebb;background:#fffff0"></td>
        <td><input id="inp-ciudad" type="text" placeholder="Ciudad" maxlength="50"
            style="width:90%;padding:3px;border:1px solid #4a7ebb;background:#fffff0"></td>`;
    tbody.insertBefore(fila, tbody.firstChild);
    document.getElementById("inp-desc")?.focus();
    fila.querySelectorAll("input").forEach(inp => {
        inp.addEventListener("keydown", e => {
            if (e.key === "Enter")  guardarNuevoDepartamento();
            if (e.key === "Escape") { fila.remove(); mostrarEstado("Cancelado.", "warn"); }
        });
    });
   
    const btn = [...document.querySelectorAll(".nav-btn")].find(b => b.textContent.trim() === "Nuevo");
    if (btn) { btn.textContent = "Guardar"; btn.dataset.mg = "1"; }
    mostrarEstado("Complete los campos y presione Guardar o Enter.", "info");
}

async function guardarNuevoDepartamento() {
    const desc   = document.getElementById("inp-desc")?.value.trim();
    const ciudad = document.getElementById("inp-ciudad")?.value.trim();
    if (!desc || !ciudad) { mostrarEstado("Complete descripción y ciudad.", "warn"); return; }

    if (modoDemo) {
        demoData.push({ id: demoNextId++, descripcion: desc.toUpperCase(), ciudad: ciudad.toUpperCase() });
        mostrarEstado("★ [DEMO] Departamento agregado.", "demo");
        restaurarBtnNuevo();
        renderizarTabla(document.querySelector(".data-grid tbody"), demoData);
        return;
    }
    try {
        await apiFetch(API_BASE_URL, {
            method: "POST",
            body: JSON.stringify({ descripcion: desc.toUpperCase(), ciudad: ciudad.toUpperCase() })
        });
        mostrarEstado("Departamento registrado exitosamente.", "ok");
        restaurarBtnNuevo();
        cargarDepartamentos();
    } catch (err) {
        mostrarEstado(`Error al guardar: ${err.message}`, "error");
    }
}

function restaurarBtnNuevo() {
    const btn = [...document.querySelectorAll(".nav-btn")].find(b => b.dataset.mg === "1");
    if (btn) { btn.textContent = "Nuevo"; delete btn.dataset.mg; }
    document.getElementById("fila-nueva")?.remove();
}


function activarEdicion() {
    const f = document.querySelector(".active-row");
    if (!f || f.id === "fila-nueva") { mostrarEstado("Seleccione un registro para editar.", "warn"); return; }
    if (edicion.activo) { guardarEdicion(); return; }

    const id = f.dataset.id, desc = f.children[1].textContent.trim(), ciudad = f.children[2].textContent.trim();
    f.innerHTML = `
        <td>${id}</td>
        <td><input id="edit-desc" value="${desc}" maxlength="100"
            style="width:95%;padding:3px;border:1px solid #e07b00;background:#fff8e1"></td>
        <td><input id="edit-ciudad" value="${ciudad}" maxlength="50"
            style="width:90%;padding:3px;border:1px solid #e07b00;background:#fff8e1"></td>`;
    edicion.activo = true; edicion.id = id;
    document.getElementById("edit-desc")?.focus();
    f.querySelectorAll("input").forEach(inp => {
        inp.addEventListener("keydown", e => {
            if (e.key === "Enter")  guardarEdicion();
            if (e.key === "Escape") cancelarEdicion(f, id, desc, ciudad);
        });
    });
    const btn = [...document.querySelectorAll(".nav-btn")].find(b => b.textContent.trim() === "Editar");
    if (btn) btn.textContent = "Confirmar";
    mostrarEstado("Edite los campos y presione Confirmar o Enter.", "info");
}

async function guardarEdicion() {
    const f = document.querySelector(".active-row");
    if (!f || !edicion.id) return;
    const desc   = document.getElementById("edit-desc")?.value.trim();
    const ciudad = document.getElementById("edit-ciudad")?.value.trim();
    if (!desc || !ciudad) { mostrarEstado("Los campos no pueden estar vacíos.", "warn"); return; }

    if (modoDemo) {
        const item = demoData.find(d => String(d.id) === String(edicion.id));
        if (item) { item.descripcion = desc.toUpperCase(); item.ciudad = ciudad.toUpperCase(); }
        mostrarEstado("★ [DEMO] Registro actualizado.", "demo");
        edicion.activo = false; restaurarBtnEditar();
        renderizarTabla(document.querySelector(".data-grid tbody"), demoData);
        return;
    }
    try {
        await apiFetch(`${API_BASE_URL}/${edicion.id}`, {
            method: "PUT",
            body: JSON.stringify({ descripcion: desc.toUpperCase(), ciudad: ciudad.toUpperCase() })
        });
        mostrarEstado("Registro actualizado correctamente.", "ok");
        edicion.activo = false; restaurarBtnEditar(); cargarDepartamentos();
    } catch (err) {
        mostrarEstado(`Error al actualizar: ${err.message}`, "error");
    }
}

function cancelarEdicion(f, id, desc, ciudad) {
    f.innerHTML = `<td>${id}</td><td>${desc}</td><td>${ciudad}</td>`;
    edicion.activo = false; restaurarBtnEditar();
    mostrarEstado("Edición cancelada.", "warn");
}

function restaurarBtnEditar() {
    const btn = [...document.querySelectorAll(".nav-btn")].find(b => b.textContent.trim() === "Confirmar");
    if (btn) btn.textContent = "Editar";
}


async function confirmarEliminar() {
    const f = document.querySelector(".active-row");
    if (!f || f.id === "fila-nueva") { mostrarEstado("Seleccione un registro para eliminar.", "warn"); return; }
    const id = f.dataset.id, desc = f.children[1]?.textContent.trim() || id;
    if (!confirm(`¿Eliminar "${desc}" (ID: ${id})?\nEsta acción no se puede deshacer.`)) return;

    if (modoDemo) {
        demoData = demoData.filter(d => String(d.id) !== String(id));
        mostrarEstado(`★ [DEMO] "${desc}" eliminado.`, "demo");
        renderizarTabla(document.querySelector(".data-grid tbody"), demoData);
        return;
    }
    try {
        await apiFetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
        mostrarEstado(`"${desc}" eliminado correctamente.`, "ok");
        edicion.id = null; cargarDepartamentos();
    } catch (err) {
        mostrarEstado(`Error al eliminar: ${err.message}`, "error");
    }
}


function seleccionarFila() {
    const f = document.querySelector(".active-row");
    if (!f || f.id === "fila-nueva") { mostrarEstado("Seleccione una fila primero.", "warn"); return; }
    mostrarEstado(`Seleccionado → [${f.dataset.id}] ${f.children[1]?.textContent} — ${f.children[2]?.textContent}`, "ok");
}
