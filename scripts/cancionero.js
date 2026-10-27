function toggleCancion(btn) {
    const itemActual = btn.parentElement;
    const todosLosItems = document.querySelectorAll('.cancion-item');

    todosLosItems.forEach(item => {
        if (item === itemActual) {
            item.classList.toggle('activo');
        } else {
            // Cerramos los demás para que no se amontone el audio si suenan varios
            item.classList.remove('activo');
            
            // Opcional: Pausar el audio de los que se cierran
            const audio = item.querySelector('audio');
            if (audio) audio.pause();
        }
    });
}

/* ==========================================================================
   CUENTA ATRÁS PARA EL PRÓXIMO JUEVES SANTO (Madrugá 2027)
   ========================================================================== */
function iniciarCuentaAtras() {
    // Elementos del DOM en index.html
    const elDias = document.getElementById('dias');
    const elHoras = document.getElementById('horas');
    const elMinutos = document.getElementById('minutos');
    const elSegundos = document.getElementById('segundos');

    // Si no existen en la página actual (ej. estamos en otra sección), no ejecuta el intervalo
    if (!elDias || !elHoras || !elMinutos || !elSegundos) return;

    // Fecha del próximo Jueves Santo: 25 de Marzo de 2027 a las 00:00:00
    const fechaObjetivo = new Date('2027-03-25T00:00:00').getTime();

    function actualizarReloj() {
        const ahora = new Date().getTime();
        const diferencia = fechaObjetivo - ahora;

        if (diferencia <= 0) {
            elDias.innerText = '00';
            elHoras.innerText = '00';
            elMinutos.innerText = '00';
            elSegundos.innerText = '00';
            return;
        }

        // Cálculos de tiempo
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

        // Formateo con ceros a la izquierda
        elDias.innerText = String(dias).padStart(2, '0');
        elHoras.innerText = String(horas).padStart(2, '0');
        elMinutos.innerText = String(minutos).padStart(2, '0');
        elSegundos.innerText = String(segundos).padStart(2, '0');
    }

    // Ejecutar inmediatamente y programar intervalo cada segundo
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
}

// Arrancar el contador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', iniciarCuentaAtras);