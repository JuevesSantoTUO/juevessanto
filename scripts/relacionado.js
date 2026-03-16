function cambiarTipoRel(evento, seccionId) {
    // 1. Ocultar todas las secciones de contenido relacionado
    document.querySelectorAll('.tab-contenido-rel').forEach(tab => {
        tab.classList.remove('activo');
    });

    // 2. Quitar el estado activo de todos los botones de pestañas
    document.querySelectorAll('.tab-main').forEach(btn => {
        btn.classList.remove('activo');
    });

    // 3. Mostrar la sección seleccionada y activar el botón correspondiente
    document.getElementById(seccionId).classList.add('activo');
    evento.currentTarget.classList.add('activo');
}

const datosActos = {
    'funcion-2026': {
        titulo: "Función Principal de Instituto 2026",
        contenido: `
            <iframe width="560" height="315" src="https://www.youtube.com/embed/1RZUbVlYYv4?si=JbietYlk2nBSsxcW" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
            <h3 class="protocolo-titulo">Protocolo de Asistencia</h3>
            <div class="protocolo-seccion">
                <h4>Lugar y Hora</h4>
                <p>Parroquia de San Francisco de Javier (Oviedo). 12:30h.</p>
            </div>
            <div class="protocolo-seccion">
                <h4>FUNCIÓN PRINCIPAL DE INSTITUTO MMXXVI</h4>
                <p>Hermandad de Los Estudiantes de Oviedo.</p>
            </div>
            <div class="protocolo-seccion">
                <h4>Las Palabras de Rumbito</h4>
                <p style="text-align: justify;">El 1 de Marzo de 2026 se celebraba La Función Principal de Instituto de la Hermandad de Los Estvdiantes de Oviedo, momento en que se otorga la medalla de la Hermandad a los nuevos Hermanos, así como las menciones a autoridades y personas que, con su labor desinteresada, colaboran con la Hermandad en los diferentes actos. <br><br>

                    En esta ocasión, se otrogó una Mención de Hermandad a un servidor (Rumbito). Quiero aprovechar esta plataforma para recibir con el mayor de los honores este reconocimiento, aunque también me gustaría aclarar que tratándose de un reconocimiento personal, no lo considero mío, si no de todos aquellos que habéis llegado a esta plataforma, app o webapp, porque en algún momento habéis estado acompañándonos en nuestro Jueves Santo. <br><br>

                    Quiero hacer hincapié en nuestros inicios, en aquellos comienzos. Aquel paso nuevo, sin las decoraciones que ahora se presentan en los pasos del Santísimo Cristo de la Misericordia y el del Prendimiento. <br><br>

                    No puedo, si no, recordar a mis compañeros en aquel entonces en activo y antiguos tunos de nuestra muy Gallarda y Trovadora, Tuna Universitaria de Oviedo. Gasol, con quien adapté las versiones de La Saeta y La Muerte no es el Final. Baldomero, Pubis, Febrero, Gordillo, Huevato, Lausín, Vizcaino... y todos los que se me olvidan, pero que estuvieron presentes desde 2008. <br><br>

                    No quiero tampoco faltar a la verdad, y reconocer que en momentos de horas bajas, la ayuda y el mantenimiento de esta tradición se orquestó gracias a ese conglomerado de antiguos tunos de todas las tunas de Asturias (y al que también siento el orgullo de pertenecer), La Tuna Antigua de la Universidad de Oviedo. <br><br>

                    Posteriormente, ya con todos los compañeros de las tunas de toda España que han colaborado con nosotros para hacer mucho más grande este día, en beneficio de la Tuna (como institución), de la Hermandad de Los Estvdiantes, y la procesión de la Madrugá de Oviedo, mantengo que este reconocimiento personal, lo es gracias a todos vosotros. <br><br>
                </p>
                <p style="text-align: center;">¡Muchas gracias a todos por este reconocimiento, y por acompañarnos en esta tradición tan nuestra! <br><br>
                
                ¡VIVA LA TUNA! <br>
                ¡VIVA EL JUEVES SANTO DE OVIEDO! <br>
                ¡VIVA LA HERMANDAD DE LOS ESTUDIANTES!
                </p>
            </div>
        `
    }
    // Aquí puedes añadir más actos...
};

function abrirModalActo(id) {
    const modal = document.getElementById('modal-acto');
    const contenedor = document.getElementById('detalle-acto');
    const acto = datosActos[id];

    if (acto) {
        contenedor.innerHTML = acto.contenido;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function cerrarModalActo() {
    document.getElementById('modal-acto').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Cerrar al hacer clic fuera del contenido
window.onclick = function(event) {
    const modal = document.getElementById('modal-acto');
    if (event.target == modal) {
        cerrarModalActo();
    }
}