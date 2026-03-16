// FILTRO DE CATEGORÍAS
function filtrarGaleria(categoria) {
    const fotos = document.querySelectorAll('.foto-item');
    const botones = document.querySelectorAll('.filtro-btn');

    // Cambiar estado de botones
    botones.forEach(btn => {
        btn.classList.toggle('activo', btn.textContent.toLowerCase() === categoria || (categoria === 'todos' && btn.textContent === 'Todos'));
    });

    // Filtrar fotos con animación
    fotos.forEach(foto => {
        foto.style.opacity = '0';
        foto.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            if (categoria === 'todos' || foto.classList.contains(categoria)) {
                foto.style.display = 'block';
                setTimeout(() => {
                    foto.style.opacity = '1';
                    foto.style.transform = 'scale(1)';
                }, 50);
            } else {
                foto.style.display = 'none';
            }
        }, 300);
    });
}

// LÓGICA DEL LIGHTBOX
function abrirImagen(elemento) {
    const src = elemento.querySelector('img').src;
    const lightbox = document.getElementById('lightbox');
    const imgFull = document.getElementById('img-full');
    
    imgFull.src = src;
    lightbox.style.display = 'flex';
}

function cerrarImagen() {
    document.getElementById('lightbox').style.display = 'none';
}

function cambiarTipo(evento, seccionId) {
    // 1. Ocultar todas las secciones principales
    document.querySelectorAll('.tab-contenido-galeria').forEach(tab => {
        tab.classList.remove('activo');
    });

    // 2. Quitar activo de los botones principales
    document.querySelectorAll('.tab-main').forEach(btn => {
        btn.classList.remove('activo');
    });

    // 3. Activar lo seleccionado
    document.getElementById(seccionId).classList.add('activo');
    evento.currentTarget.classList.add('activo');
}

function filtrarGaleria(año) {
    const fotos = document.querySelectorAll('.foto-item');
    const botones = document.querySelectorAll('.btn-filtro');

    botones.forEach(btn => {
        btn.classList.toggle('activo', btn.innerText.toLowerCase() === año || (año === 'todos' && btn.innerText === 'Todos'));
    });

    fotos.forEach(foto => {
        if (año === 'todos' || foto.classList.contains(año)) {
            foto.style.display = 'block';
        } else {
            foto.style.display = 'none';
        }
    });
}