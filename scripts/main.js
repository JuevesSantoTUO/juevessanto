// Función para cargar componentes HTML
async function cargarComponente(id, archivo) {
    try {
        const response = await fetch(archivo);
        const html = await response.text();
        document.getElementById(id).innerHTML = html;
        
        // Si acabamos de cargar el header, inicializamos el menú hamburguesa
        if (id === 'header-container') {
            iniciarMenu();
        }
    } catch (error) {
        console.error("Error cargando el componente:", error);
    }
}

// Lógica del Menú (separada para que funcione tras la carga)
function iniciarMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('activo');
        });

        // Cerrar al hacer clic en cualquier enlace
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('activo');
            });
        });

        // Cerrar si se hace clic fuera del menú
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('activo');
            }
        });
    }
}

// Cargar todo al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarComponente('header-container', 'assets/header.html');
    cargarComponente('footer-container', 'assets/footer.html');
});

// --- CONFIGURACIÓN DE FECHA OBJETIVO ---
// Formato ISO: AAAA-MM-DDTHH:MM:SS+02:00 (El +02:00 fija la hora de España en abril)
const FECHA_OBJETIVO = new Date('2026-04-02T00:00:00+02:00').getTime();

function actualizarContador() {
    const ahora = new Date().getTime();
    const distancia = FECHA_OBJETIVO - ahora;

    // Cálculos de tiempo
    const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

    // Inyectar en el HTML
    if (document.getElementById('dias')) {
        document.getElementById('dias').innerText = dias;
        document.getElementById('horas').innerText = horas;
        document.getElementById('minutos').innerText = minutos;
        document.getElementById('segundos').innerText = segundos;
    }

    // Si la fecha ya pasó
    if (distancia < 0) {
        clearInterval(intervalo);
        document.getElementById('countdown').innerHTML = "¡Ha llegado el Jueves Santo!";
    }
}

// Ejecutar cada segundo
const intervalo = setInterval(actualizarContador, 1000);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registrado con éxito', reg))
      .catch(err => console.log('Error al registrar el Service Worker', err));
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usamos './sw.js' en lugar de '/sw.js'
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registrado', reg))
      .catch(err => console.log('Error SW', err));
  });
}

// --- BOTÓN DE LIMPIEZA DE CACHÉ (Mantenimiento) ---
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.cache-reset-btn')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="cache-reset-container">
                <button onclick="limpiarCacheYRecargar()" class="cache-reset-btn">
                    <span class="cache-icon">⚙️</span>
                    <span class="cache-text">¿Falta información? Pulsa aquí para actualizar</span>
                </button>
            </div>
        `);
    }
});

// La función que hace la limpieza profunda
function limpiarCacheYRecargar() {
    if (confirm("Se va a actualizar la aplicación para mostrar los últimos cambios. ¿Continuar?")) {
        // 1. Borrar todas las cachés de la PWA
        if ('caches' in window) {
            caches.keys().then(names => {
                for (let name of names) caches.delete(name);
            });
        }
        
        // 2. Desregistrar el Service Worker para que se descargue el nuevo
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.unregister();
                }
            });
        }

        // 3. Limpiar almacenamiento local (opcional, por si usas estados)
        localStorage.clear();
        sessionStorage.clear();

        // 4. Recarga forzada desde el servidor
        window.location.reload(true);
    }
}
