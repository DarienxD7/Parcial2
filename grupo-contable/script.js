const BASE_URL = "https://team-404-grupo-4-del-integrante-jhamel.onrender.com";

// ── Referencias DOM ───────────────────────────────────────────
const inputGrupo = document.getElementById("inputGrupo");
const selectNombre = document.getElementById("selectNombre");
const inputVidaUtil = document.getElementById("inputVidaUtil");
const textareaObs = document.getElementById("textareaObs");
const checkDepre = document.getElementById("checkDepre");

const btnNuevo = document.getElementById("btnNuevo");
const btnModificar = document.getElementById("btnModificar");
const btnGuardar = document.getElementById("btnGuardar");
const btnEliminar = document.getElementById("btnEliminar");
const btnDeshacer = document.getElementById("btnDeshacer");
const btnSalir = document.getElementById("btnSalir");

const tablaBody = document.getElementById("tablaBody");

const popup = document.getElementById("popup");
const popupIcono = document.getElementById("popupIcono");
const popupMensaje = document.getElementById("popupMensaje");
const btnAceptar = document.getElementById("btnAceptar");
const btnCerrarPopup = document.getElementById("btnCerrarPopup");

// ── Estado ────────────────────────────────────────────────────
let modoActual = "ver";
let idSeleccionado = null;

// ── Inicio ────────────────────────────────────────────────────
actualizarBotones("ver");
cargarRegistros();

// ── Popup ─────────────────────────────────────────────────────
btnAceptar.addEventListener("click", () => popup.style.display = "none");
btnCerrarPopup.addEventListener("click", () => popup.style.display = "none");

function mostrarPopup(msg, exito = false) {
    popupMensaje.textContent = msg;
    popupIcono.textContent = exito ? "i" : "!";
    popupIcono.style.background = exito ? "#3c7ec2" : "#c23c3c";
    popup.style.display = "block";
}

// ── Botón NUEVO ───────────────────────────────────────────────
btnNuevo.addEventListener("click", () => {
    limpiarFormulario();
    modoActual = "nuevo";
    idSeleccionado = null;
    actualizarBotones("editando");
    inputGrupo.focus();
});

// ── Botón MODIFICAR ───────────────────────────────────────────
btnModificar.addEventListener("click", () => {
    if (!idSeleccionado) {
        mostrarPopup("Seleccione un registro de la tabla primero.");
        return;
    }
    modoActual = "modificar";
    actualizarBotones("editando");
});

// ── Botón GUARDAR ─────────────────────────────────────────────
btnGuardar.addEventListener("click", async () => {
    const codigoOrganismo = parseInt(inputGrupo.value.trim());
    const descripcion = selectNombre.value.trim();
    const gestion = parseInt(inputVidaUtil.value.trim());
    const sigla = textareaObs.value.trim() || (checkDepre.checked ? "DEPRECIA" : "NO DEPRECIA");

    if (!codigoOrganismo || !descripcion || !gestion) {
        mostrarPopup("Complete todos los campos obligatorios.");
        return;
    }

    const body = { gestion, codigoOrganismo, descripcion, sigla };
    console.log("Enviando:", JSON.stringify(body));

    try {
        btnGuardar.disabled = true;

        let response;
        if (modoActual === "nuevo") {
            response = await fetch(`${BASE_URL}/api/organismos-fin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
        } else {
            response = await fetch(`${BASE_URL}/api/organismos-fin/${idSeleccionado}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: idSeleccionado, ...body })
            });
        }

        const texto = await response.text();
        console.log("Respuesta:", response.status, texto);

        if (response.ok) {
            mostrarPopup("Datos guardados correctamente.", true);
            await cargarRegistros();
            limpiarFormulario();
            modoActual = "ver";
            idSeleccionado = null;
            actualizarBotones("ver");
        } else {
            let errMsg = `Error ${response.status}: No se pudo guardar.`;
            try { errMsg = JSON.parse(texto).message || errMsg; } catch (_) { }
            mostrarPopup(errMsg);
        }
    } catch (err) {
        mostrarPopup("Error de conexión con el servidor.");
        console.error(err);
    } finally {
        btnGuardar.disabled = false;
    }
});

// ── Botón ELIMINAR ────────────────────────────────────────────
btnEliminar.addEventListener("click", async () => {
    if (!idSeleccionado) {
        mostrarPopup("Seleccione un registro de la tabla primero.");
        return;
    }
    if (!confirm("¿Eliminar este registro?")) return;

    try {
        const response = await fetch(`${BASE_URL}/api/organismos-fin/${idSeleccionado}`, {
            method: "DELETE"
        });

        if (response.ok) {
            mostrarPopup("Registro eliminado.", true);
            await cargarRegistros();
            limpiarFormulario();
            idSeleccionado = null;
            actualizarBotones("ver");
        } else {
            mostrarPopup(`Error ${response.status}: No se pudo eliminar.`);
        }
    } catch (err) {
        mostrarPopup("Error de conexión.");
    }
});

// ── Botón DESHACER ────────────────────────────────────────────
btnDeshacer.addEventListener("click", () => {
    limpiarFormulario();
    modoActual = "ver";
    idSeleccionado = null;
    actualizarBotones("ver");
});

// ── Botón SALIR ───────────────────────────────────────────────
btnSalir.addEventListener("click", () => {
    if (confirm("¿Desea salir?")) {
        limpiarFormulario();
        actualizarBotones("ver");
    }
});

// ── Cargar registros (GET) ────────────────────────────────────
async function cargarRegistros() {
    try {
        const res = await fetch(`${BASE_URL}/api/organismos-fin`);
        if (!res.ok) return;
        const lista = await res.json();
        tablaBody.innerHTML = "";

        if (!Array.isArray(lista) || lista.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:#888">Sin registros</td></tr>`;
            return;
        }
        lista.forEach(item => agregarFila(item));
    } catch (e) {
        console.warn("No se pudieron cargar registros:", e);
        tablaBody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:#c00">Error al cargar</td></tr>`;
    }
}

// ── Agregar fila ──────────────────────────────────────────────
function agregarFila(item) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.codigoOrganismo ?? item.id}</td><td>${item.descripcion}</td>`;
    tr.style.cursor = "pointer";

    tr.addEventListener("click", () => {
        document.querySelectorAll(".data-table tbody tr").forEach(r => r.style.background = "");
        tr.style.background = "#b8d0ea";

        idSeleccionado = item.id;
        inputGrupo.value = item.codigoOrganismo ?? "";
        selectNombre.value = item.descripcion ?? "";
        inputVidaUtil.value = item.gestion ?? "";
        textareaObs.value = item.sigla ?? "";
        checkDepre.checked = (item.sigla === "DEPRECIA");
    });

    tablaBody.appendChild(tr);
}

// ── Habilitar/deshabilitar botones ────────────────────────────
function actualizarBotones(modo) {
    const editando = modo === "editando";
    btnGuardar.classList.toggle("btn-disabled", !editando);
    btnDeshacer.classList.toggle("btn-disabled", !editando);
    btnGuardar.disabled = !editando;
    btnDeshacer.disabled = !editando;
}

// ── Limpiar formulario ────────────────────────────────────────
function limpiarFormulario() {
    inputGrupo.value = "";
    inputVidaUtil.value = "";
    textareaObs.value = "";
    checkDepre.checked = false;
    selectNombre.selectedIndex = 0;
    document.querySelectorAll(".data-table tbody tr").forEach(r => r.style.background = "");
}