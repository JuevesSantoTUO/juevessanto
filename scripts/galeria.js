let currentImgIndex = 0;
let visibleImages = [];
let touchStartX = 0;
let touchEndX = 0;

// Sincroniza las imágenes que se pueden navegar según el filtro
function actualizarListaVisible() {
    const fotos = document.querySelectorAll('.foto-item');
    visibleImages = Array.from(fotos)
        .filter(f => f.style.display !== 'none')
        .map(f => f.querySelector('img').src);
}

function abrirImagen(elemento) {
    actualizarListaVisible();
    const src = elemento.querySelector('img').src;
    currentImgIndex = visibleImages.indexOf(src);
    
    mostrarImagen(currentImgIndex);
    document.getElementById('lightbox').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function mostrarImagen(index) {
    document.getElementById('img-full').src = visibleImages[index];
}

function cambiarImagen(dir) {
    currentImgIndex += dir;
    if (currentImgIndex >= visibleImages.length) currentImgIndex = 0;
    if (currentImgIndex < 0) currentImgIndex = visibleImages.length - 1;
    mostrarImagen(currentImgIndex);
}

function cerrarImagen() {
    document.getElementById('lightbox').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// --- GESTOS TÁCTILES ---
const lb = document.getElementById('lightbox');
lb.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; });
lb.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 50) cambiarImagen(1);
    if (touchEndX - touchStartX > 50) cambiarImagen(-1);
});

// --- FILTROS Y TABS ---
function filtrarGaleria(año) {
    const fotos = document.querySelectorAll('.foto-item');
    const botones = document.querySelectorAll('.btn-filtro');

    botones.forEach(btn => btn.classList.toggle('activo', btn.innerText.toLowerCase() === año || (año === 'todos' && btn.innerText === 'Todos')));

    fotos.forEach(foto => {
        const mostrar = (año === 'todos' || foto.classList.contains(año));
        foto.style.display = mostrar ? 'block' : 'none';
    });
    actualizarListaVisible();
}

function cambiarTipo(evento, seccionId) {
    document.querySelectorAll('.tab-contenido-galeria').forEach(tab => tab.classList.remove('activo'));
    document.querySelectorAll('.tab-main').forEach(btn => btn.classList.remove('activo'));
    document.getElementById(seccionId).classList.add('activo');
    evento.currentTarget.classList.add('activo');
}