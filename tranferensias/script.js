const BASE_URL = "https://team-404-grupo-4-saul-cusipuma.onrender.com";

async function fetchAPI(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`Error ${response.status} en ${endpoint}`);
    return await response.json();
}


function llenarSelect(selectId, datos, campoValor, campoTexto) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">-- Seleccione --</option>';


    let lista = datos;
    if (!Array.isArray(datos)) {

        const clave = Object.keys(datos).find(k => Array.isArray(datos[k]));
        lista = clave ? datos[clave] : [];
    }

    if (!lista || lista.length === 0) {
        select.innerHTML = '<option value="">-- Sin datos --</option>';
        return;
    }

    lista.forEach(item => {
        const option = document.createElement("option");

        option.value = item[campoValor] ?? item.id ?? item.idOficina ?? item.idUsuario ?? item.idOrganismo ?? "";

        option.textContent = item[campoTexto] ?? item.nombre ?? item.name ?? item.descripcion ?? item.detalle ?? JSON.stringify(item);
        select.appendChild(option);
    });
}

function mostrarError(msg) {
    const div = document.getElementById("mensajeError");
    div.textContent = "⚠ " + msg;
    div.style.display = "block";
    setTimeout(() => div.style.display = "none", 5000);
}

function mostrarExito(msg) {
    const div = document.getElementById("mensajeExito");
    div.textContent = "✔ " + msg;
    div.style.display = "block";
    setTimeout(() => div.style.display = "none", 4000);
}

async function cargarDatos() {

    try {
        const unidades = await fetchAPI("/api/organismos-fin");
        console.log("Unidades:", unidades);
        const lista = Array.isArray(unidades) ? unidades : Object.values(unidades).find(v => Array.isArray(v)) ?? [];
        if (lista.length === 0) throw new Error("Sin datos");
        llenarSelect("nuevaUnidad", lista, "id", "nombre");
    } catch (e) {
        console.error("Unidades error:", e);
        convertirAInput("nuevaUnidad");
        mostrarError("Nueva Unidad: escribe manualmente (" + e.message + ")");
    }

    try {
        const oficinas = await fetchAPI("/api/oficina");
        console.log("Oficinas:", oficinas);
        llenarSelect("nuevaOficina", oficinas, "id", "nombre");
    } catch (e) {
        console.error("Oficinas error:", e);
        convertirAInput("nuevaOficina");
        mostrarError("No se pudo cargar Oficinas (revisa CORS o endpoint)");
    }

    try {
        const usuarios = await fetchAPI("/usuarios");
        console.log("Usuarios:", usuarios);
        llenarSelect("nuevoResponsable", usuarios, "id", "nombre");
        llenarSelect("auxiliar", usuarios, "id", "nombre");
    } catch (e) {
        console.error("Usuarios error:", e);
        convertirAInput("nuevoResponsable");
        convertirAInput("auxiliar");
        mostrarError("No se pudo cargar Usuarios (revisa CORS o endpoint)");
    }
}

function convertirAInput(selectId) {
    const select = document.getElementById(selectId);
    const input = document.createElement("input");
    input.type = "text";
    input.id = selectId;
    input.placeholder = "Escriba aquí...";
    input.className = select.className;
    select.parentNode.replaceChild(input, select);
}

async function enviarTransferencia() {
    const nuevaUnidad = document.getElementById("nuevaUnidad").value;
    const nuevaOficina = document.getElementById("nuevaOficina").value;
    const nuevoResponsable = document.getElementById("nuevoResponsable").value;
    const auxiliar = document.getElementById("auxiliar").value;

    if (!nuevaUnidad || !nuevaOficina || !nuevoResponsable || !auxiliar) {
        mostrarError("Por favor complete todos los campos obligatorios.");
        return;
    }

    const datos = {
        nuevaUnidadId: nuevaUnidad,
        nuevaOficinaId: nuevaOficina,
        nuevoResponsableId: nuevoResponsable,
        auxiliarId: auxiliar
    };

    console.log("Datos a enviar:", datos);

    guardarEnTabla({
        unidadActual: document.getElementById("unidadActual").value,
        oficinaActual: document.getElementById("oficinaActual").value,
        responsableActual: document.getElementById("responsableActual").value,
        nuevaUnidad: document.getElementById("nuevaUnidad").value || document.getElementById("nuevaUnidad").options?.[document.getElementById("nuevaUnidad").selectedIndex]?.text || nuevaUnidad,
        nuevaOficina: document.getElementById("nuevaOficina").options?.[document.getElementById("nuevaOficina").selectedIndex]?.text || nuevaOficina,
        nuevoResponsable: document.getElementById("nuevoResponsable").value,
        auxiliar: document.getElementById("auxiliar").value
    });

    mostrarExito("Transferencia guardada correctamente.");
}

function cancelar() {
    document.getElementById("nuevaUnidad").selectedIndex = 0;
    document.getElementById("nuevaOficina").selectedIndex = 0;
    document.getElementById("nuevoResponsable").selectedIndex = 0;
    document.getElementById("auxiliar").selectedIndex = 0;
}

document.addEventListener("DOMContentLoaded", cargarDatos);

let contadorFilas = 0;

function guardarEnTabla(datos) {
    contadorFilas++;
    const tbody = document.getElementById("tablaBody");

    const filaVacia = document.getElementById("filaVacia");
    if (filaVacia) filaVacia.remove();

    const tr = document.createElement("tr");
    tr.id = "fila-" + contadorFilas;
    tr.innerHTML = `
        <td>${contadorFilas}</td>
        <td>${datos.unidadActual}</td>
        <td>${datos.oficinaActual}</td>
        <td>${datos.responsableActual}</td>
        <td>${datos.nuevaUnidad}</td>
        <td>${datos.nuevaOficina}</td>
        <td>${datos.nuevoResponsable}</td>
        <td>${datos.auxiliar}</td>
        <td><button class="btn-eliminar" onclick="eliminarFila('fila-${contadorFilas}')">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
}

function eliminarFila(idFila) {
    const fila = document.getElementById(idFila);
    if (fila) fila.remove();

    const tbody = document.getElementById("tablaBody");
    if (tbody.children.length === 0) {
        tbody.innerHTML = '<tr id="filaVacia"><td colspan="9" style="text-align:center; color:#999;">Sin registros aún</td></tr>';
    }
}