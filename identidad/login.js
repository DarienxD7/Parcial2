const BASE_URL = "https://team-404-grupo-4-saul-cusipuma.onrender.com";

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

async function iniciarSesion() {
    const nombre = document.getElementById("nombreUsuario").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();

    if (!nombre || !contrasena) {
        mostrarError("Por favor ingrese su nombre y contraseña.");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/usuarios`);
        if (!response.ok) throw new Error("No se pudo conectar con el servidor.");

        const usuarios = await response.json();
        console.log("Usuarios recibidos:", usuarios);


        const lista = Array.isArray(usuarios) ? usuarios
            : Object.values(usuarios).find(v => Array.isArray(v)) ?? [];

        const usuarioEncontrado = lista.find(u =>
            (u.nombre ?? u.name ?? "").toLowerCase() === nombre.toLowerCase()
        );

        if (!usuarioEncontrado) {
            mostrarError("Usuario no encontrado. Verifique su nombre.");
            return;
        }


        mostrarExito(`Bienvenido, ${usuarioEncontrado.nombre ?? usuarioEncontrado.name}!`);
        console.log("Usuario autenticado:", usuarioEncontrado);


        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);

    } catch (e) {
        console.error("Error de login:", e);
        mostrarError("Error al conectar con la API: " + e.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("contrasena").addEventListener("keydown", function (e) {
        if (e.key === "Enter") iniciarSesion();
    });
    document.getElementById("nombreUsuario").addEventListener("keydown", function (e) {
        if (e.key === "Enter") iniciarSesion();
    });
});