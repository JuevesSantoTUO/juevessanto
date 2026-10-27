/* ==========================================================================
   LÓGICA PRINCIPAL (main.js)
   ========================================================================== */

let fechaObjetivo = new Date("March 25, 2027 00:00:00").getTime();

document.addEventListener('DOMContentLoaded', async () => {
    iniciarMenu();
    await obtenerFechaObjetivoBBDD();
    setInterval(actualizarCuentaAtras, 1000);
});

/* Obtener fecha dinámica desde Supabase */
async function obtenerFechaObjetivoBBDD() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data } = await supabaseClient
                .from('configuracion')
                .select('valor')
                .eq('clave', 'fecha_jueves_santo')
                .maybeSingle();

            if (data && data.valor) {
                fechaObjetivo = new Date(data.valor).getTime();
            }
        } catch (e) {
            console.warn("Usando fecha estática por defecto para la cuenta atrás:", e);
        }
    }
}

/* Carga dinámica de componentes HTML (Header / Footer) */
async function cargarComponente(id, archivo) {
    try {
        const response = await fetch(archivo);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();
        const contenedor = document.getElementById(id);
        if (contenedor) {
            contenedor.innerHTML = html;
            if (id === 'header-container') iniciarMenu();
            if (id === 'footer-container' && typeof comprobarEstadoSesion === 'function') {
                comprobarEstadoSesion();
            }
        }
    } catch (error) {
        console.error("Error cargando componente:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarComponente("header-container", "assets/header.html");
    cargarComponente("footer-container", "assets/footer.html");
});

/* Menú Hamburguesa */
function iniciarMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('activo');
        });
    }
}

/* Lógica del Contador */
function actualizarCuentaAtras() {
    const ahora = new Date().getTime();
    const diferencia = fechaObjetivo - ahora;

    const diasSpan = document.getElementById('dias');
    const horasSpan = document.getElementById('horas');
    const minutosSpan = document.getElementById('minutos');
    const segundosSpan = document.getElementById('segundos');

    if (!diasSpan || !horasSpan || !minutosSpan || !segundosSpan) return;

    if (diferencia <= 0) {
        diasSpan.innerText = '00';
        horasSpan.innerText = '00';
        minutosSpan.innerText = '00';
        segundosSpan.innerText = '00';
        return;
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    diasSpan.innerText = dias < 10 ? '0' + dias : dias;
    horasSpan.innerText = horas < 10 ? '0' + horas : horas;
    minutosSpan.innerText = minutos < 10 ? '0' + minutos : minutos;
    segundosSpan.innerText = segundos < 10 ? '0' + segundos : segundos;
}