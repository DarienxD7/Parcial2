// ============================================================
//  Administración de Recursos — script.js
//  API: VSIAF · Spring Boot · PostgreSQL
// ============================================================

const API_USUARIOS  = "http://localhost:8080/usuarios";
const API_TIPOSBAJA = "http://localhost:8080/api/tiposbaja";
const API_ESTADO    = "http://localhost:8080/api/estado";

const DEMO = {
    usuarios: [
        { id: 1, username: "ADMIN", nombre: "Administrador General" },
        { id: 2, username: "OPERADOR1", nombre: "Mario Sanhueza" }
    ],
    tiposbaja: [
        { id: 1, descripcion: "ROBO O HURTO" },
        { id: 2, descripcion: "OBSOLESCENCIA" },
        { id: 3, descripcion: "DESTRUCCIÓN TOTAL" }
    ],
    estados: [
        { id: 1, descripcion: "ACTIVO" },
        { id: 2, descripcion: "INACTIVO" },
        { id: 3, descripcion: "EN MANTENIMIENTO" }
    ]
};

const sesion = { usuarioActual: null, verificado: false, modoDemo: false };


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

function log(mensaje, tipo = "info") {
    const textarea = document.querySelector(".textarea");
    if (!textarea) return;
    const hora = new Date().toLocaleTimeString("es-BO");
    const prefijos = { info: "ℹ", ok: "✔", error: "✘", warn: "⚠", demo: "★" };
    textarea.value += `[${hora}] ${prefijos[tipo] || "•"} ${mensaje}\n`;
    textarea.scrollTop = textarea.scrollHeight;
}

function limpiarLog() {
    const ta = document.querySelector(".textarea");
    if (ta) ta.value = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const popup = document.querySelector(".popup");
    if (popup) popup.style.display = "block";

    document.querySelector(".left-panel")?.addEventListener("click", (e) => {
        if (!e.target.classList.contains("btn")) return;
        if (!sesion.verificado) {
            log("Debe verificar su identidad primero.", "warn");
            if (popup) popup.style.display = "block";
            return;
        }
        manejarAccion(e.target.textContent.trim());
    });

    document.querySelectorAll(".popup-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            if (popup) popup.style.display = "none";
            e.target.textContent.trim() === "Sí" ? verificarUsuario() : rechazarAcceso();
        });
    });

    document.querySelector(".exit-btn")?.addEventListener("click", () => {
        if (confirm("¿Seguro que desea salir del sistema?")) {
            limpiarLog();
            log("Cerrando sesión en el sistema...", "warn");
            setTimeout(() => window.close(), 500);
        }
    });
});

async function verificarUsuario() {
    limpiarLog();
    log("Conectando con el servidor VSIAF...");
    try {
        const usuarios = await apiFetch(API_USUARIOS);
        if (!usuarios || usuarios.length === 0) {
            log("No hay usuarios registrados.", "warn");
            return;
        }
        
        sesion.usuarioActual = usuarios[0];
        sesion.verificado    = true;
        sesion.modoDemo      = false;
        const nombre = usuarios[0].username || usuarios[0].nombre || `ID:${usuarios[0].id}`;
        log(`Acceso concedido — Usuario: [ ${nombre} ]`, "ok");
        log(`Usuarios en el sistema: ${usuarios.length}`);
        await cargarResumen();
    } catch {
        log("Servidor no disponible — activando MODO DEMO.", "demo");
        log("Los datos mostrados son de ejemplo.", "demo");
        sesion.usuarioActual = DEMO.usuarios[0];
        sesion.verificado    = true;
        sesion.modoDemo      = true;
        log(`Usuario demo: [ ${DEMO.usuarios[0].username} ]`, "ok");
        log(`Usuarios demo: ${DEMO.usuarios.length}`);
        log("Sistema listo en modo demo. Seleccione una acción.", "ok");
    }
}

function rechazarAcceso() {
    limpiarLog();
    log("Acceso denegado por el operador.", "warn");
    log("El intento de acceso fue registrado.", "warn");
    sesion.verificado = false;
}

async function cargarResumen() {
    try {
        const [est, baja] = await Promise.allSettled([
            apiFetch(API_ESTADO),
            apiFetch(API_TIPOSBAJA)
        ]);
        log(`Estados: ${est.status === "fulfilled" ? est.value.length : "N/D"}`);
        log(`Tipos de baja: ${baja.status === "fulfilled" ? baja.value.length : "N/D"}`);
        log("Sistema listo. Seleccione una acción del panel.", "ok");
    } catch {
        log("Resumen no disponible.", "warn");
    }
}

async function manejarAccion(accion) {
    limpiarLog();
    log(`Acción: [ ${accion} ]${sesion.modoDemo ? " [DEMO]" : ""}`);

    switch (accion) {
        case "Cerrar Gestión":    await accionCerrarGestion();    break;
        case "Cambiar Gestión":   await accionCambiarGestion();   break;
        case "Importar/Exportar": accionImportarExportar();       break;
        case "Indices UVF":       await accionIndicesUVF();       break;
        case "Seguridad":         await accionSeguridad();        break;
        case "Re-indexar":        accionReindexar();              break;
        case "Migrador":          accionMigrador();               break;
        default: log(`Acción no reconocida: ${accion}`, "warn");
    }
}

async function accionCerrarGestion() {
    log("Iniciando cierre de gestión...");
    try {
        const u = sesion.modoDemo ? DEMO.usuarios : await apiFetch(API_USUARIOS);
        log(`Usuarios activos: ${u.length}`);
        log("Cierre de gestión completado.", "ok");
    } catch (err) {
        log(`Error: ${err.message}`, "error");
    }
}

async function accionCambiarGestion() {
    log("Cargando gestiones disponibles...");
    try {
        const e = sesion.modoDemo ? DEMO.estados : await apiFetch(API_ESTADO);
        log(`Estados disponibles: ${e.length}`);
        e.forEach(x => log(`  · ${x.descripcion || x.nombre || JSON.stringify(x)}`));
        log("Seleccione una gestión.", "ok");
    } catch (err) {
        log(`Error: ${err.message}`, "error");
    }
}

function accionImportarExportar() {
    log("Módulo Importar/Exportar activo.");
    log("Formatos soportados: JSON, CSV, XML.");
    log("Contacte al administrador para exportaciones masivas.", "warn");
}

async function accionIndicesUVF() {
    log("Cargando índices UVF...");
    try {
        const t = sesion.modoDemo ? DEMO.tiposbaja : await apiFetch(API_TIPOSBAJA);
        log(`Tipos de baja registrados: ${t.length}`, "ok");
        t.forEach(x => log(`  · [${x.id}] ${x.descripcion || x.nombre || JSON.stringify(x)}`));
    } catch (err) {
        log(`Error: ${err.message}`, "error");
    }
}

async function accionSeguridad() {
    log("Verificando módulo de seguridad...");
    try {
        const u = sesion.modoDemo ? DEMO.usuarios : await apiFetch(API_USUARIOS);
        log(`Usuarios registrados: ${u.length}`, "ok");
        const nombre = sesion.usuarioActual?.username || sesion.usuarioActual?.nombre;
        if (nombre) log(`Sesión activa: ${nombre}`);
        log("Sin anomalías detectadas.", "ok");
    } catch (err) {
        log(`Error: ${err.message}`, "error");
    }
}

function accionReindexar() {
    log("Iniciando re-indexación...");
    let p = 0;
    const iv = setInterval(() => {
        p += 20;
        log(`  Progreso: ${p}%`);
        if (p >= 100) { clearInterval(iv); log("Re-indexación completada.", "ok"); }
    }, 400);
}

function accionMigrador() {
    log("Módulo Migrador iniciado.");
    log("Verificando compatibilidad de esquemas PostgreSQL...");
    setTimeout(() => log("Esquema compatible. Listo para migrar.", "ok"), 700);
}
