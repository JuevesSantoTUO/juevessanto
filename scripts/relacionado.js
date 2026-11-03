/* ==========================================================================
   LÓGICA DINÁMICA DE RELACIONADO Y ACTOS (SUPABASE V2)
   ========================================================================== */

let actosCargadosGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarInstitucionesSupabase();
    cargarActosSupabase();
});

function cambiarTipoRel(evento, seccionId) {
    document.querySelectorAll('.tab-contenido-rel').forEach(tab => tab.classList.remove('activo'));
    document.querySelectorAll('.tab-main').forEach(btn => btn.classList.remove('activo'));

    document.getElementById(seccionId).classList.add('activo');
    evento.currentTarget.classList.add('activo');
}

/* --- CARGAR INSTITUCIONES DESDE SUPABASE --- */
async function cargarInstitucionesSupabase() {
    const contenedor = document.querySelector('.relacionado-grid');
    if (!contenedor || !supabaseClient) return;

    const { data: instituciones, error } = await supabaseClient
        .from('relacionado_instituciones')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true });

    if (error || !instituciones || instituciones.length === 0) {
        return; // Mantiene el HTML estático si hay algún fallo
    }

    contenedor.innerHTML = instituciones.map(inst => `
        <a href="${inst.url_web}" target="_blank" rel="noopener noreferrer" class="entidad-card">
            <div class="logo-box">
                <img src="${inst.logo_url || 'img/relacionado/logo-ayto.png'}" alt="${inst.nombre}">
            </div>
            <h3>${inst.nombre}</h3>
            <p>${inst.descripcion || ''}</p>
            <span class="link-label">Visitar portal ↗</span>
        </a>
    `).join('');
}

/* --- CARGAR ACTOS ESPECIALES DESDE SUPABASE --- */
async function cargarActosSupabase() {
    const contenedor = document.querySelector('.actos-container');
    if (!contenedor || !supabaseClient) return;

    const { data: actos, error } = await supabaseClient
        .from('relacionado_actos')
        .select('*')
        .eq('activo', true)
        .order('fecha_acto', { ascending: false });

    if (error || !actos || actos.length === 0) return;

    actosCargadosGlobal = actos;

    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    contenedor.innerHTML = actos.map(acto => {
        const fechaObj = new Date(acto.fecha_acto);
        const dia = String(fechaObj.getDate()).padStart(2, '0');
        const mes = meses[fechaObj.getMonth()];
        const anio = fechaObj.getFullYear();

        return `
            <article class="acto-card" style="margin-bottom: 20px;">
                <div class="acto-fecha">
                    <span class="dia">${dia}</span>
                    <span class="mes">${mes}</span>
                    <span class="año">${anio}</span>
                </div>
                <div class="acto-info">
                    <div class="tag-acto">${acto.tag || 'Acto Especial'}</div>
                    <h3>${acto.titulo}</h3>
                    <p>${acto.descripcion_corta || ''}</p>
                    <button class="btn-abrir-acto" onclick="abrirModalActoDinámico('${acto.id}')">Ver Protocolo y Detalles</button>
                </div>
            </article>
        `;
    }).join('');
}

/* --- ABRIR MODAL CON DATOS DE SUPABASE --- */
window.abrirModalActoDinámico = function(actoId) {
    const acto = actosCargadosGlobal.find(a => a.id === actoId);
    const modal = document.getElementById('modal-acto');
    const contenedor = document.getElementById('detalle-acto');

    if (acto && modal && contenedor) {
        let videoEmbed = '';
        if (acto.youtube_url) {
            let embedUrl = acto.youtube_url;
            if (embedUrl.includes('watch?v=')) {
                embedUrl = embedUrl.replace('watch?v=', 'embed/');
            }
            videoEmbed = `<div class="video-responsive" style="margin-bottom: 20px;"><iframe src="${embedUrl}" title="Vídeo del acto" frameborder="0" allowfullscreen></iframe></div>`;
        }

        contenedor.innerHTML = `
            ${videoEmbed}
            <h3 class="protocolo-titulo">${acto.titulo}</h3>
            ${acto.contenido_html || ''}
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.cerrarModalActo = function() {
    const modal = document.getElementById('modal-acto');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

window.onclick = function(event) {
    const modal = document.getElementById('modal-acto');
    if (event.target === modal) {
        cerrarModalActo();
    }
};