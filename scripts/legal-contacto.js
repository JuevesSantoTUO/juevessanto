function abrirPestaña(evento, pestañaNombre) {
    // Ocultar paneles
    const paneles = document.getElementsByClassName("tab-pane");
    for (let i = 0; i < paneles.length; i++) {
        paneles[i].classList.remove("activo");
    }

    // Quitar activo de botones
    const botones = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < botones.length; i++) {
        botones[i].classList.remove("activo");
    }

    // Mostrar actual
    document.getElementById(pestañaNombre).classList.add("activo");
    evento.currentTarget.classList.add("activo");
}