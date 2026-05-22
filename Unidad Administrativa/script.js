const BASE_URL = "https://team-404-grupo-4-del-integrante-jhamel.onrender.com";

// ── Referencias DOM ───────────────────────────────────────────
const inputCodigo = document.getElementById("inputCodigo");
const inputCiudad = document.getElementById("inputCiudad");
const inputDescripcion = document.getElementById("inputDescripcion");

const btnGrabar = document.getElementById("btnGrabar");
const btnSalir = document.getElementById("btnSalir");

const popup = document.getElementById("popup");
const popupMensaje = document.getElementById("popupMensaje");
const popupIcono = document.getElementById("popupIcono");
const btnAceptar = document.getElementById("btnAceptar");
const btnCerrarPopup = document.getElementById("btnCerrarPopup");

const tablaBody = document.getElementById("tablaBody");
const filaVacia = document.getElementById("filaVacia");

// ── Botón GRABAR ──────────────────────────────────────────────
btnGrabar.addEventListener("click", async () => {
    const idVal = inputCodigo.value.trim();
    const nombre = inputCiudad.value.trim();
    const descripcion = inputDescripcion.value.trim();

    if (!idVal || !nombre || !descripcion) {
        mostrarPopup("Por favor complete todos los campos.", false);
        return;
    }

    // El body SIN id para que el servidor lo genere automáticamente,
    // o CON id si el Swagger lo requiere — probamos sin id primero.
    const body = {
        nombre: nombre,
        descripcion: descripcion,
        estado: "A"
    };

    console.log("Enviando:", JSON.stringify(body));

    try {
        btnGrabar.disabled = true;
        btnGrabar.textContent = "Grabando...";

        const response = await fetch(`${BASE_URL}/api/oficina`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const texto = await response.text();
        console.log("Respuesta del servidor:", response.status, texto);

        if (response.ok) {
            let dataGuardada = {};
            try { dataGuardada = JSON.parse(texto); } catch (_) { }

            mostrarPopup("Los datos fueron ingresados correctamente", true);
            agregarFilaTabla(dataGuardada.id || idVal, nombre, descripcion, dataGuardada.estado || "A");
            limpiarFormulario();
        } else {
            let errMsg = `Error ${response.status}: No se pudo guardar.`;
            try {
                const errJson = JSON.parse(texto);
                errMsg = errJson.message || errJson.error || errMsg;
            } catch (_) { }
            mostrarPopup(errMsg, false);
        }

    } catch (error) {
        mostrarPopup("Error de conexión con el servidor.", false);
        console.error(error);
    } finally {
        btnGrabar.disabled = false;
        btnGrabar.textContent = "Grabar";
    }
});

// ── Botón SALIR ───────────────────────────────────────────────
btnSalir.addEventListener("click", () => {
    if (confirm("¿Desea limpiar el formulario?")) {
        limpiarFormulario();
    }
});

// ── Popup ─────────────────────────────────────────────────────
btnAceptar.addEventListener("click", cerrarPopup);
btnCerrarPopup.addEventListener("click", cerrarPopup);

// ── Scroll del textarea ───────────────────────────────────────
document.getElementById("scrollUp").addEventListener("click", () => {
    inputDescripcion.scrollTop -= 20;
});
document.getElementById("scrollDown").addEventListener("click", () => {
    inputDescripcion.scrollTop += 20;
});

// ── Cargar registros existentes al iniciar ────────────────────
cargarRegistros();

async function cargarRegistros() {
    try {
        const res = await fetch(`${BASE_URL}/api/oficina`);
        if (!res.ok) return;
        const lista = await res.json();
        if (Array.isArray(lista) && lista.length > 0) {
            lista.forEach(item => {
                agregarFilaTabla(item.id, item.nombre, item.descripcion, item.estado);
            });
        }
    } catch (e) {
        console.warn("No se pudieron cargar registros previos:", e);
    }
}

// ── Helpers ───────────────────────────────────────────────────
function agregarFilaTabla(id, nombre, descripcion, estado) {
    if (filaVacia) filaVacia.remove();

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${id}</td>
        <td>${nombre}</td>
        <td>${descripcion}</td>
        <td>${estado}</td>
    `;
    tablaBody.appendChild(tr);
}

function mostrarPopup(mensaje, exito) {
    popupMensaje.textContent = mensaje;
    popupIcono.textContent = exito ? "i" : "!";
    popupIcono.style.background = exito ? "#3c7ec2" : "#c23c3c";
    popup.style.display = "block";
}

function cerrarPopup() {
    popup.style.display = "none";
}

function limpiarFormulario() {
    inputCodigo.value = "";
    inputCiudad.value = "";
    inputDescripcion.value = "";
    inputCodigo.focus();
}