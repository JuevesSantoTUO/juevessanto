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