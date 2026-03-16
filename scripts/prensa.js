function abrirNoticia(url, medio) {
    const visor = document.getElementById('visor-prensa');
    const linkExterno = document.getElementById('link-externo');
    const txtMedio = document.getElementById('visor-medio');

    // Cambiamos http por https por seguridad si fuera necesario
    const urlSegura = url.replace("http://", "https://");
    
    txtMedio.innerText = medio;
    linkExterno.href = urlSegura;
    
    visor.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Evita scroll de fondo
}

function cerrarNoticia() {
    document.getElementById('visor-prensa').style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaura scroll
}