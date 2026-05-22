const API_BASE = "https://team-404-grupo-4-del-integrante-jhamel.onrender.com";

const inputUsuario     = document.querySelectorAll(".fila-top input")[0];
const inputContrasena  = document.querySelectorAll(".fila-top input")[1];
const inputNombre      = document.querySelector(".input-ancho");
const inputDescripcion = document.querySelector("textarea");
const radios           = document.querySelectorAll("input[name='tipo']");

const btnPrimero    = document.querySelectorAll(".botones button")[0];
const btnAnterior   = document.querySelectorAll(".botones button")[1];
const btnSiguiente  = document.querySelectorAll(".botones button")[2];
const btnUltimo     = document.querySelectorAll(".botones button")[3];
const btnNuevo      = document.querySelectorAll(".botones button")[4];
const btnEditar     = document.querySelectorAll(".botones button")[5];
const btnGuardar    = document.querySelectorAll(".botones button")[6];
const btnDeshacer   = document.querySelectorAll(".botones button")[7];
const btnSalir      = document.querySelectorAll(".botones button")[8];

let usuarios = [];
let indice   = 0;
let modoEdicion = false;
let backupCampos = {};

async function cargarUsuarios() {
    try {
        const res = await fetch(`${API_BASE}/usuarios`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        usuarios = await res.json();
        if (usuarios.length > 0) {
            indice = 0;
            mostrarUsuario(indice);
        } else {
            limpiarCampos();
        }
    } catch (err) {
        console.warn("Error al cargar usuarios:", err.message);
    }
}

function mostrarUsuario(i) {
    const u = usuarios[i];
    if (!u) return;
    inputUsuario.value    = u.nombre    ?? "";
    inputContrasena.value = u.correo    ?? "";
    inputNombre.value     = u.nombre    ?? "";
    inputDescripcion.value = "";
    radios[0].checked = false;
    radios[1].checked = true;
}

function limpiarCampos() {
    inputUsuario.value     = "";
    inputContrasena.value  = "";
    inputNombre.value      = "";
    inputDescripcion.value = "";
    radios[0].checked = false;
    radios[1].checked = false;
}

function setModoEdicion(activo) {
    modoEdicion = activo;
    const campos = [inputUsuario, inputContrasena, inputNombre, inputDescripcion, ...radios];
    campos.forEach(c => c.disabled = !activo);
    btnGuardar.classList.toggle("btn-activo", activo);
    btnDeshacer.classList.toggle("btn-activo", activo);
}

btnPrimero.addEventListener("click", () => {
    if (usuarios.length === 0) return;
    indice = 0;
    mostrarUsuario(indice);
});

btnAnterior.addEventListener("click", () => {
    if (indice > 0) { indice--; mostrarUsuario(indice); }
});

btnSiguiente.addEventListener("click", () => {
    if (indice < usuarios.length - 1) { indice++; mostrarUsuario(indice); }
});

btnUltimo.addEventListener("click", () => {
    if (usuarios.length === 0) return;
    indice = usuarios.length - 1;
    mostrarUsuario(indice);
});

btnNuevo.addEventListener("click", () => {
    limpiarCampos();
    setModoEdicion(true);
    backupCampos = {};
});

btnEditar.addEventListener("click", () => {
    if (usuarios.length === 0) { alert("No hay usuario seleccionado."); return; }
    backupCampos = {
        usuario:     inputUsuario.value,
        contrasena:  inputContrasena.value,
        nombre:      inputNombre.value,
        descripcion: inputDescripcion.value
    };
    setModoEdicion(true);
});

btnGuardar.addEventListener("click", async () => {
    const nombre = inputNombre.value.trim();
    const correo = inputContrasena.value.trim();

    if (!nombre || !correo) {
        alert("Completa Nombre Completo y Contraseña (correo).");
        return;
    }

    const payload = { nombre, correo };
    const usuarioActual = usuarios[indice];
    const esNuevo = !usuarioActual || !backupCampos.usuario === undefined;

    try {
        let res;
        if (usuarioActual && Object.keys(backupCampos).length > 0) {
            res = await fetch(`${API_BASE}/usuarios/${usuarioActual.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            // Nuevo usuario
            res = await fetch(`${API_BASE}/usuarios`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || `HTTP ${res.status}`);
        }

        alert("✅ Usuario guardado correctamente.");
        setModoEdicion(false);
        await cargarUsuarios();

    } catch (err) {
        alert(`Error: ${err.message}`);
        console.error(err);
    }
});


btnDeshacer.addEventListener("click", () => {
    if (Object.keys(backupCampos).length > 0) {
        inputUsuario.value     = backupCampos.usuario     ?? "";
        inputContrasena.value  = backupCampos.contrasena  ?? "";
        inputNombre.value      = backupCampos.nombre      ?? "";
        inputDescripcion.value = backupCampos.descripcion ?? "";
    } else {
        mostrarUsuario(indice);
    }
    setModoEdicion(false);
});

sbtnSalir.addEventListener("click", () => {
    if (history.length > 1) history.back();
    else window.close();
});

setModoEdicion(false);
cargarUsuarios();