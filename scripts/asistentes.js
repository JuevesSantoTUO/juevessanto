function abrirPestaña(evento, pestañaNombre) {
    // 1. Ocultar todos los paneles
    const paneles = document.getElementsByClassName("tab-pane");
    for (let i = 0; i < paneles.length; i++) {
        paneles[i].classList.remove("activo");
    }

    // 2. Quitar la clase "activo" de todos los botones
    const botones = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < botones.length; i++) {
        botones[i].classList.remove("activo");
    }

    // 3. Mostrar el panel actual y marcar el botón como activo
    document.getElementById(pestañaNombre).classList.add("activo");
    evento.currentTarget.classList.add("activo");
}