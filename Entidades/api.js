const API_BASE = "https://team-404-grupo-4-del-integrante-jhamel.onrender.com";

const selectEntidad    = document.getElementById("selectEntidad");
const inputSigla       = document.getElementById("inputSigla");
const inputInstitucion = document.getElementById("inputInstitucion");
const btnOk            = document.getElementById("btnOk");
const btnSalir         = document.getElementById("btnSalir");
const tablaBody        = document.getElementById("tablaBody");

function llenarTabla(data) {
    if (!data || data.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="5" class="estado-carga">No hay registros aún.</td></tr>`;
        return;
    }
    tablaBody.innerHTML = data.map(org => `
        <tr>
            <td>${org.id ?? "-"}</td>
            <td>${org.codigoOrganismo ?? "-"}</td>
            <td>${org.descripcion ?? "-"}</td>
            <td>${org.sigla ?? "-"}</td>
            <td>${org.gestion ?? "-"}</td>
        </tr>
    `).join("");
}

async function cargarEntidades() {
    try {
        const res = await fetch(`${API_BASE}/api/organismos-fin`);
        if (!res.ok) throw new Error("Error al cargar");
        const data = await res.json();
        llenarTabla(data);
    } catch (err) {
        console.warn("API no respondió:", err.message);
        tablaBody.innerHTML = `<tr><td colspan="5" class="estado-carga">No se pudo conectar con la API.</td></tr>`;
    }
}

btnOk.addEventListener("click", async () => {
    const sigla       = inputSigla.value.trim();
    const descripcion = inputInstitucion.value.trim();

    if (!sigla || !descripcion) {
        alert("Por favor completa todos los campos.");
        return;
    }

    const textoSelect = selectEntidad.selectedOptions[0]?.text ?? "";
    const codigoMatch = textoSelect.match(/^\d+/);
    const codigo      = codigoMatch ? parseInt(codigoMatch[0]) : 1;

    const payload = {
        gestion:         2026,
        codigoOrganismo: codigo,
        descripcion:     descripcion,
        sigla:           sigla
    };

    console.log("Enviando payload:", payload);

    try {
        const res = await fetch(`${API_BASE}/api/organismos-fin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || `HTTP ${res.status}`);
        }

        const resultado = await res.json();
        alert(`✅ Entidad guardada correctamente. ID: ${resultado.id}`);

        inputSigla.value       = "";
        inputInstitucion.value = "";
        cargarEntidades();

    } catch (err) {
        alert(`❌ Error al guardar:\n${err.message}`);
        console.error(err);
    }
});

btnSalir.addEventListener("click", () => {
    if (history.length > 1) {
        history.back();
    } else {
        window.close();
    }
});

cargarEntidades();