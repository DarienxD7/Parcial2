// ============================================================
//  Oficina — script.js
//  API: VSIAF · Spring Boot · PostgreSQL
// ============================================================
 
const API_BASE_URL = "http://localhost:8080/api/oficina";
 

const DEMO_INICIAL = [
    { id:1, responsable:"MARIO SANHUEZA CONDORI",    cargo:"DIRECTOR",  ci:"4521873", expedido:"LP", estado:"ACTIVO",   observacion:"" },
    { id:2, responsable:"PAOLA GUTIERREZ CKACKA",    cargo:"TÉCNICO",   ci:"7823641", expedido:"CB", estado:"ACTIVO",   observacion:"" },
    { id:3, responsable:"ELVA ALVARADO GERONIMO",    cargo:"AUXILIAR",  ci:"3197542", expedido:"SC", estado:"INACTIVO", observacion:"" },
    { id:4, responsable:"SEBASTIÁN ANZE COLQUE",     cargo:"JEFE",      ci:"6045289", expedido:"OR", estado:"ACTIVO",   observacion:"" },
    { id:5, responsable:"FLORENCIA ALANOCA CONDORI", cargo:"OPERADOR",  ci:"9134760", expedido:"PT", estado:"ACTIVO",   observacion:"" }
];
 
let demoData   = JSON.parse(JSON.stringify(DEMO_INICIAL));
let demoNextId = 6;
let modoDemo   = false;
 

const app = {
    modo: "ver",         
    idSeleccionado: null,
    historial: null       
};
 

async function apiFetch(url, options = {}) {
    const r = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers }
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    if (r.status === 204) return null;
    return r.json();
}
 
function mostrarEstado(msg, tipo = "info") {
    const colores = { info:"#0f3d67", ok:"#155724", error:"#721c24", warn:"#856404", demo:"#5a3e8c" };
    const fondos  = { info:"#dce8f5", ok:"#d4edda",  error:"#f8d7da", warn:"#fff3cd", demo:"#ede8f7" };
    let b = document.getElementById("status-bar");
    if (!b) {
        b = document.createElement("div");
        b.id = "status-bar";
        Object.assign(b.style, {
            padding:"6px 14px", fontSize:"13px", fontWeight:"bold",
            borderTop:"1px solid #aaa", transition:"opacity 0.4s"
        });
        document.querySelector(".ventana")?.appendChild(b);
    }
    b.textContent      = msg;
    b.style.color      = colores[tipo] || colores.info;
    b.style.background = fondos[tipo]  || fondos.info;
    b.style.opacity    = "1";
    clearTimeout(b._t);
    if (tipo !== "error") b._t = setTimeout(() => { b.style.opacity = "0"; }, 3500);
}
 

document.addEventListener("DOMContentLoaded", () => {
    cargarOficinas();
 
    
    document.body.addEventListener("click", (e) => {
        if (!e.target.matches("button")) return;
        const txt = e.target.textContent.trim();
 
        switch (txt) {
            
            case "Nuevo":      iniciarNuevo();        break;
            case "Modificar":  iniciarModificacion(); break;
            case "Activar":    cambiarEstado("ACTIVO");   break;
            case "Inactivar":  cambiarEstado("INACTIVO"); break;
 
            case "Activo":     filtrarPorEstado("ACTIVO");   break;
            case "Inactivo":   filtrarPorEstado("INACTIVO"); break;
            case "Guardar":    guardarOficina();   break;
            case "Deshacer":   deshacerCambio();   break;
            case "Salir":
                if (confirm("¿Desea cerrar la ventana de Oficinas?")) window.close();
                break;
 
            
            case "▲": scrollTextarea(-30); break;
            case "▼": scrollTextarea(30);  break;
        }
    });
 
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") cancelarOperacion();
    });
});
 
function scrollTextarea(px) {
    const ta = document.querySelector("textarea");
    if (ta) ta.scrollTop += px;
}
 

async function cargarOficinas(filtro = null) {
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888">Cargando...</td></tr>`;
 
    try {
        const datos = await apiFetch(API_BASE_URL);
        modoDemo = false;
        const lista = filtro ? datos.filter(o => o.estado === filtro) : datos;
        renderizarTabla(tbody, lista);
        if (datos[0] && !filtro) { app.idSeleccionado = datos[0].id; cargarEnFormulario(datos[0]); }
        mostrarEstado(`${lista.length} oficina(s) cargada(s).`, "ok");
    } catch {
        modoDemo = true;
        demoData = JSON.parse(JSON.stringify(DEMO_INICIAL));
        demoNextId = 6;
        const lista = filtro ? demoData.filter(o => o.estado === filtro) : demoData;
        renderizarTabla(tbody, lista);
        if (demoData[0] && !filtro) { app.idSeleccionado = demoData[0].id; cargarEnFormulario(demoData[0]); }
        mostrarEstado("★ MODO DEMO — Spring Boot no disponible. Datos de ejemplo.", "demo");
    }
}
 
function renderizarTabla(tbody, lista) {
    tbody.innerHTML = "";
    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888">Sin registros</td></tr>`;
        return;
    }
    
    lista.forEach((o, i) => tbody.appendChild(crearFila(o, i === 0)));
    
    const vacias = Math.max(0, 8 - lista.length);
    for (let i = 0; i < vacias; i++) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td>`;
        tbody.appendChild(tr);
    }
}
 
function crearFila(of, activa = false) {
    const tr = document.createElement("tr");
    tr.dataset.id = of.id;
    if (activa) tr.classList.add("active-row");
 
    tr.innerHTML = `
        <td>${of.id           || ""}</td>
        <td>${of.responsable  || ""}</td>
        <td>${of.cargo        || ""}</td>
        <td>${of.ci           || ""}</td>
        <td>${of.expedido     || ""}</td>
        <td>${of.estado       || "ACTIVO"}</td>`;
 
    tr.addEventListener("click", () => {
        document.querySelectorAll("table tbody tr").forEach(r => r.classList.remove("active-row"));
        tr.classList.add("active-row");
        app.idSeleccionado = of.id;
        cargarEnFormulario(of);
        mostrarEstado(`Seleccionado: [${of.id}] ${of.responsable || ""}`, "info");
    });
    return tr;
}
 

function cargarEnFormulario(of) {
    const inp = document.querySelector(".oficina-box input");
    if (inp) inp.value = of.id || "";
 
    const ta = document.querySelector("textarea");
    if (ta) ta.value = of.observacion || "";
 
    const est = document.querySelector(".estado");
    if (est) est.textContent = of.estado || "ACTIVO";
 
    
    const sel = document.querySelector("select");
    if (sel && of.cargo) {
        const opt = [...sel.options].find(o =>
            o.textContent.trim().toUpperCase().includes(of.cargo.toUpperCase())
        );
        if (opt) sel.value = opt.value;
    }
}
 
function limpiarFormulario() {
    const inp = document.querySelector(".oficina-box input");
    if (inp) inp.value = "";
    const ta = document.querySelector("textarea");
    if (ta) ta.value = "";
    const est = document.querySelector(".estado");
    if (est) est.textContent = "ACTIVO";
    app.idSeleccionado = null;
}
 
function leerFormulario() {
    const sel = document.querySelector("select");
    return {
        observacion: document.querySelector("textarea")?.value.trim() || "",
        cargo: sel?.options[sel.selectedIndex]?.textContent.trim() || "",
        estado: document.querySelector(".estado")?.textContent.trim() || "ACTIVO"
    };
}
 

function iniciarNuevo() {
    limpiarFormulario();
    app.modo = "nuevo";
    app.historial = null;
    document.querySelector(".oficina-box input")?.focus();
    mostrarEstado("Complete los datos y presione Guardar.", "info");
}
 
function iniciarModificacion() {
    const f = document.querySelector(".active-row");
    if (!f) { mostrarEstado("Seleccione una oficina de la tabla para modificar.", "warn"); return; }
   
    app.historial = {
        id:           f.dataset.id,
        responsable:  f.children[1]?.textContent.trim(),
        cargo:        f.children[2]?.textContent.trim(),
        ci:           f.children[3]?.textContent.trim(),
        expedido:     f.children[4]?.textContent.trim(),
        estado:       f.children[5]?.textContent.trim(),
        observacion:  document.querySelector("textarea")?.value || ""
    };
    app.modo = "editar";
    app.idSeleccionado = f.dataset.id;
    mostrarEstado(`Editando ID: ${app.idSeleccionado} — modifique y presione Guardar.`, "info");
}
 
function cancelarOperacion() {
    if (app.modo === "ver") return;
    app.modo = "ver";
    cargarOficinas();
    mostrarEstado("Operación cancelada.", "warn");
}
 

async function cambiarEstado(nuevoEstado) {
    const f = document.querySelector(".active-row");
    if (!f) { mostrarEstado("Seleccione una oficina de la tabla primero.", "warn"); return; }
 
    const id   = f.dataset.id;
    const resp = f.children[1]?.textContent.trim() || `ID ${id}`;
    const estadoActual = f.children[5]?.textContent.trim();
 
    if (estadoActual === nuevoEstado) {
        mostrarEstado(`La oficina ya está en estado ${nuevoEstado}.`, "warn");
        return;
    }
 
    
    app.historial = { id, campo: "estado", valorAnterior: estadoActual };
 
    if (modoDemo) {
        const item = demoData.find(d => String(d.id) === String(id));
        if (item) item.estado = nuevoEstado;
        const est = document.querySelector(".estado");
        if (est) est.textContent = nuevoEstado;
        
        f.children[5].textContent = nuevoEstado;
        mostrarEstado(`★ [DEMO] "${resp}" → ${nuevoEstado}.`, "demo");
        return;
    }
 
    try {
        
        const actual = await apiFetch(`${API_BASE_URL}/${id}`);
        await apiFetch(`${API_BASE_URL}/${id}`, {
            method: "PUT",
            body: JSON.stringify({ ...actual, estado: nuevoEstado })
        });
        mostrarEstado(`"${resp}" cambiado a ${nuevoEstado}.`, "ok");
        cargarOficinas();
    } catch (err) {
        mostrarEstado(`Error al cambiar estado: ${err.message}`, "error");
    }
}
 

function filtrarPorEstado(estado) {
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;
    const lista = modoDemo ? demoData : null;
 
    if (modoDemo) {
        const filtrados = demoData.filter(o => o.estado === estado);
        renderizarTabla(tbody, filtrados);
        mostrarEstado(`Mostrando: ${filtrados.length} oficina(s) con estado ${estado}.${filtrados.length === 0 ? " — Presione Activo/Inactivo para ver todos." : ""}`, "info");
    } else {
        cargarOficinas(estado);
    }
}
 

async function guardarOficina() {
    if (app.modo === "editar") { await actualizarOficina(); return; }
    if (app.modo !== "nuevo")  { mostrarEstado("Presione Nuevo antes de Guardar.", "warn"); return; }
 
    const responsable = prompt("Nombre del Responsable:");
    if (!responsable?.trim()) { mostrarEstado("El responsable es obligatorio.", "warn"); return; }
    const ci = prompt("Cédula de Identidad (CI):");
    if (!ci?.trim()) { mostrarEstado("La CI es obligatoria.", "warn"); return; }
    const expedido = prompt("Expedido en (LP, CB, SC, OR, PT, BN, TJ, CH, PD):");
    if (!expedido?.trim()) { mostrarEstado("El lugar de expedición es obligatorio.", "warn"); return; }
 
    const datos = {
        ...leerFormulario(),
        responsable: responsable.trim().toUpperCase(),
        ci:          ci.trim(),
        expedido:    expedido.trim().toUpperCase()
    };
 
    if (modoDemo) {
        const nuevo = { id: demoNextId++, ...datos };
        demoData.push(nuevo);
        app.historial = null;
        mostrarEstado(`★ [DEMO] Oficina "${datos.responsable}" registrada con ID ${nuevo.id}.`, "demo");
        app.modo = "ver";
        limpiarFormulario();
        renderizarTabla(document.querySelector("table tbody"), demoData);
        return;
    }
    try {
        await apiFetch(API_BASE_URL, { method: "POST", body: JSON.stringify(datos) });
        mostrarEstado("Oficina registrada exitosamente.", "ok");
        app.modo = "ver";
        limpiarFormulario();
        cargarOficinas();
    } catch (err) {
        mostrarEstado(`Error al guardar: ${err.message}`, "error");
    }
}
 
async function actualizarOficina() {
    if (!app.idSeleccionado) { mostrarEstado("Seleccione una oficina.", "warn"); return; }
    const f = document.querySelector(".active-row");
 
    const responsable = prompt("Modificar Responsable:", f?.children[1]?.textContent.trim() || "");
    if (!responsable?.trim()) { mostrarEstado("Modificación cancelada.", "warn"); app.modo = "ver"; return; }
    const ci = prompt("Modificar CI:", f?.children[3]?.textContent.trim() || "");
    if (!ci?.trim()) { mostrarEstado("Modificación cancelada.", "warn"); app.modo = "ver"; return; }
    const expedido = prompt("Modificar Expedido:", f?.children[4]?.textContent.trim() || "");
    if (!expedido?.trim()) { mostrarEstado("Modificación cancelada.", "warn"); app.modo = "ver"; return; }
 
    const datos = {
        ...leerFormulario(),
        responsable: responsable.trim().toUpperCase(),
        ci:          ci.trim(),
        expedido:    expedido.trim().toUpperCase()
    };
 
    if (modoDemo) {
        const item = demoData.find(d => String(d.id) === String(app.idSeleccionado));
        if (item) Object.assign(item, datos);
        mostrarEstado(`★ [DEMO] Oficina ID ${app.idSeleccionado} actualizada.`, "demo");
        app.modo = "ver";
        renderizarTabla(document.querySelector("table tbody"), demoData);
        return;
    }
    try {
        await apiFetch(`${API_BASE_URL}/${app.idSeleccionado}`, {
            method: "PUT",
            body: JSON.stringify(datos)
        });
        mostrarEstado("Oficina actualizada correctamente.", "ok");
        app.modo = "ver";
        cargarOficinas();
    } catch (err) {
        mostrarEstado(`Error al actualizar: ${err.message}`, "error");
    }
}
 

async function deshacerCambio() {
    if (!app.historial) { mostrarEstado("No hay acción para deshacer.", "warn"); return; }
 
    const h = app.historial;
 
    // Deshacer cambio de estado
    if (h.campo === "estado") {
        if (modoDemo) {
            const item = demoData.find(d => String(d.id) === String(h.id));
            if (item) {
                item.estado = h.valorAnterior;
                renderizarTabla(document.querySelector("table tbody"), demoData);
                mostrarEstado(`★ [DEMO] Estado restaurado a ${h.valorAnterior}.`, "demo");
            }
        } else {
            try {
                const actual = await apiFetch(`${API_BASE_URL}/${h.id}`);
                await apiFetch(`${API_BASE_URL}/${h.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ ...actual, estado: h.valorAnterior })
                });
                mostrarEstado(`Estado restaurado a ${h.valorAnterior}.`, "ok");
                cargarOficinas();
            } catch (err) {
                mostrarEstado(`Error al deshacer: ${err.message}`, "error");
            }
        }
        app.historial = null;
        return;
    }
 
    
    if (h.responsable) {
        if (modoDemo) {
            const item = demoData.find(d => String(d.id) === String(h.id));
            if (item) {
                Object.assign(item, {
                    responsable: h.responsable, cargo: h.cargo,
                    ci: h.ci, expedido: h.expedido,
                    estado: h.estado, observacion: h.observacion
                });
                renderizarTabla(document.querySelector("table tbody"), demoData);
                mostrarEstado("★ [DEMO] Cambios deshecho correctamente.", "demo");
            }
        } else {
            try {
                await apiFetch(`${API_BASE_URL}/${h.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        responsable: h.responsable, cargo: h.cargo,
                        ci: h.ci, expedido: h.expedido,
                        estado: h.estado, observacion: h.observacion
                    })
                });
                mostrarEstado("Cambios deshecho correctamente.", "ok");
                cargarOficinas();
            } catch (err) {
                mostrarEstado(`Error al deshacer: ${err.message}`, "error");
            }
        }
        app.historial = null;
    }
}
 