/* ==========================================================================
   CARGA, INTERACCIÓN Y COMENTARIOS DE NOTICIAS (scripts/noticia-detalle.js)
   ========================================================================== */

let noticiaActualId = null;
let usuarioSesion = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarDetalleNoticia();
});

async function cargarDetalleNoticia() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
        setTimeout(cargarDetalleNoticia, 150);
        return;
    }

    const params = new URLSearchParams(window.location.search);
    noticiaActualId = params.get('id');

    if (!noticiaActualId) {
        document.getElementById('noticia-loading').innerText = "Noticia no encontrada.";
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    usuarioSesion = session?.user || null;

    const { data: noticia, error } = await supabaseClient
        .from('blog')
        .select('*')
        .eq('id', noticiaActualId)
        .maybeSingle();

    if (error || !noticia) {
        document.getElementById('noticia-loading').innerText = "No se pudo cargar la noticia solicitada.";
        return;
    }

    // Actualizar Meta Tags dinámicamente para rastreadores y pestañas del navegador
    actualizarMetaTags(noticia);

    document.getElementById('noticia-fecha').innerText = new Date(noticia.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    document.getElementById('noticia-titulo').innerText = noticia.titulo;
    document.getElementById('noticia-autor').innerText = `Por ${noticia.autor}`;

    if (noticia.imagen_url) {
        document.getElementById('noticia-imagen').src = noticia.imagen_url;
        document.getElementById('noticia-img-box').style.display = 'block';
    }

    document.getElementById('noticia-cuerpo').innerHTML = noticia.contenido;

    document.getElementById('noticia-loading').style.display = 'none';
    document.getElementById('noticia-article').style.display = 'block';

    // Cargar me gustas y comentarios
    actualizarLikesNoticia();
    cargarComentarios();
}

/* FUNCIÓN DE INYECCIÓN DINÁMICA DE META TAGS OPEN GRAPH */
function actualizarMetaTags(noticia) {
    document.title = `${noticia.titulo} - Jueves Santo Oviedo`;

    const setMeta = (property, content) => {
        let el = document.querySelector(`meta[property="${property}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute('property', property);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    };

    const resumenTexto = noticia.resumen || noticia.contenido.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
    const imagenNoticia = noticia.imagen_url || 'https://juevessantotuo.github.io/juevessanto/img/logo.png';

    setMeta('og:title', noticia.titulo);
    setMeta('og:description', resumenTexto);
    setMeta('og:image', imagenNoticia);
    setMeta('og:url', window.location.href);
}

/* GESTIÓN DE ME GUSTA EN NOTICIA */
async function actualizarLikesNoticia() {
    const { data: likes } = await supabaseClient.from('blog_likes').select('user_id').eq('blog_id', noticiaActualId);
    
    const count = likes ? likes.length : 0;
    document.getElementById('like-count').innerText = count;

    const btnLike = document.getElementById('btn-like-noticia');
    if (usuarioSesion && likes?.some(l => l.user_id === usuarioSesion.id)) {
        btnLike.classList.add('liked');
    } else {
        btnLike.classList.remove('liked');
    }
}

window.toggleLikeNoticia = async function() {
    if (!usuarioSesion) {
        alert("Debes iniciar sesión para dar me gusta.");
        return;
    }

    const { data: existente } = await supabaseClient
        .from('blog_likes')
        .select('id')
        .eq('blog_id', noticiaActualId)
        .eq('user_id', usuarioSesion.id)
        .maybeSingle();

    if (existente) {
        await supabaseClient.from('blog_likes').delete().eq('id', existente.id);
    } else {
        await supabaseClient.from('blog_likes').insert([{ blog_id: noticiaActualId, user_id: usuarioSesion.id }]);
    }

    actualizarLikesNoticia();
};

/* COMPARTIR EN REDES SOCIALES */
window.compartirSocial = function(red) {
    const url = encodeURIComponent(window.location.href);
    const titulo = encodeURIComponent(document.getElementById('noticia-titulo').innerText);

    if (red === 'wa') window.open(`https://api.whatsapp.com/send?text=${titulo}%20${url}`, '_blank');
    if (red === 'fb') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
};

window.copiarEnlaceNoticia = function() {
    navigator.clipboard.writeText(window.location.href);
    alert("¡Enlace copiado al portapapeles!");
};

/* GESTIÓN DE COMENTARIOS */
async function cargarComentarios() {
    const box = document.getElementById('lista-comentarios');
    
    const { data: comentarios, error } = await supabaseClient
        .from('blog_comentarios')
        .select('*')
        .eq('blog_id', noticiaActualId)
        .order('created_at', { ascending: false });

    if (error || !comentarios || comentarios.length === 0) {
        box.innerHTML = `<p style="color:#666; font-size:0.85rem;">No hay comentarios todavía. ¡Sé el primero en opinar!</p>`;
        document.getElementById('num-comentarios').innerText = 0;
        return;
    }

    document.getElementById('num-comentarios').innerText = comentarios.length;
    box.innerHTML = '';

    for (const c of comentarios) {
        const fecha = new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        
        // Contar likes del comentario
        const { data: likesCom } = await supabaseClient.from('blog_comentario_likes').select('user_id').eq('comentario_id', c.id);
        const numLikes = likesCom ? likesCom.length : 0;
        const dioLike = usuarioSesion && likesCom?.some(l => l.user_id === usuarioSesion.id);

        const item = document.createElement('div');
        item.className = 'comentario-item';
        item.innerHTML = `
            <div class="comentario-header">
                <span class="comentario-autor">${c.nombre_usuario}</span>
                <span class="comentario-fecha">${fecha}</span>
            </div>
            <div class="comentario-texto">${c.comentario}</div>
            <div class="comentario-footer" style="display: flex; justify-content: space-between; align-items: center;">
                <button class="btn-like-comentario ${dioLike ? 'liked' : ''}" onclick="toggleLikeComentario('${c.id}')">
                    ❤️ ${numLikes} Me gusta
                </button>
                <button class="btn-like-comentario" style="color: #ffaa00; font-size: 0.75rem;" onclick="abrirModalReporte('${c.id}')" title="Denunciar comentario no pertinente">
                    🚩 Reportar
                </button>
            </div>
        `;
        box.appendChild(item);
    }
}

window.publicarComentario = async function(e) {
    e.preventDefault();
    if (!usuarioSesion) {
        alert("Debes iniciar sesión para dejar un comentario.");
        return;
    }

    const texto = document.getElementById('txt-nuevo-comentario').value.trim();
    if (!texto) return;

    // Obtener mote o email del usuario
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', usuarioSesion.id).maybeSingle();
    const { data: inscripcion } = await supabaseClient.from('inscripciones').select('nombre, mote').eq('user_id', usuarioSesion.id).maybeSingle();

    const nombrePublico = inscripcion ? (inscripcion.mote ? `Tuno ${inscripcion.mote}` : inscripcion.nombre) : usuarioSesion.email.split('@')[0];

    const { error } = await supabaseClient.from('blog_comentarios').insert([{
        blog_id: noticiaActualId,
        user_id: usuarioSesion.id,
        nombre_usuario: nombrePublico,
        comentario: texto
    }]);

    if (!error) {
        document.getElementById('txt-nuevo-comentario').value = '';
        cargarComentarios();
    }
};

window.toggleLikeComentario = async function(comentarioId) {
    if (!usuarioSesion) {
        alert("Debes iniciar sesión para reaccionar a los comentarios.");
        return;
    }

    const { data: existente } = await supabaseClient
        .from('blog_comentario_likes')
        .select('id')
        .eq('comentario_id', comentarioId)
        .eq('user_id', usuarioSesion.id)
        .maybeSingle();

    if (existente) {
        await supabaseClient.from('blog_comentario_likes').delete().eq('id', existente.id);
    } else {
        await supabaseClient.from('blog_comentario_likes').insert([{ comentario_id: comentarioId, user_id: usuarioSesion.id }]);
    }

    cargarComentarios();
};

/* GESTIÓN DE REPORTES Y DENUNCIAS */
let comentarioIdAReportar = null;

window.abrirModalReporte = function(comentarioId) {
    if (!usuarioSesion) {
        alert("Debes iniciar sesión para reportar un comentario.");
        return;
    }
    comentarioIdAReportar = comentarioId;

    let modalReport = document.getElementById('modal-reporte-comentario');
    if (!modalReport) {
        const modalHTML = `
        <div id="modal-reporte-comentario" class="modal-interno" style="display: none;">
            <div class="modal-contenido perfil-modal-box" style="max-width: 450px;">
                <button class="cerrar-modal" onclick="cerrarModalReporte()">&times;</button>
                <h3 class="protocolo-titulo" style="margin-bottom: 15px; color: #ffaa00;">🚩 Denunciar Comentario</h3>
                <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 15px;">Indica el motivo por el cual este comentario debe ser revisado por la organización:</p>
                
                <form onsubmit="enviarDenunciaComentario(event)">
                    <div class="input-group">
                        <label>Motivo del Reporte</label>
                        <select id="reporte-motivo-select" required style="width: 100%; background: #161616; color: #fff; padding: 10px; border-radius: 6px; border: 1px solid rgba(212,175,55,0.3);">
                            <option value="Lenguaje ofensivo o insultos">Lenguaje ofensivo o insultos</option>
                            <option value="Acoso o desacreditación personal">Acoso o desacreditación personal</option>
                            <option value="Contenido no pertinente o spam">Contenido no pertinente o spam</option>
                            <option value="Provocación / Falta de respeto institucional">Provocación / Falta de respeto</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-tuna-ui full-width" style="margin-top: 15px;">Enviar Reporte</button>
                </form>
                <div id="reporte-status-msg" class="mensaje-estado" style="margin-top: 10px;"></div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modalReport = document.getElementById('modal-reporte-comentario');
    }
    modalReport.style.display = 'flex';
};

window.cerrarModalReporte = function() {
    const modal = document.getElementById('modal-reporte-comentario');
    if (modal) modal.style.display = 'none';
};

window.enviarDenunciaComentario = async function(e) {
    e.preventDefault();
    const status = document.getElementById('reporte-status-msg');
    status.innerText = "Enviando reporte...";

    const motivo = document.getElementById('reporte-motivo-select').value;

    const { error } = await supabaseClient.from('blog_denuncias').insert([{
        comentario_id: comentarioIdAReportar,
        blog_id: noticiaActualId,
        denunciante_id: usuarioSesion.id,
        motivo: motivo
    }]);

    if (error) {
        if (error.code === '23505') {
            status.innerText = "Ya has reportado este comentario previamente.";
        } else {
            status.innerText = "Error enviando el reporte: " + error.message;
        }
    } else {
        status.innerText = "¡Reporte enviado! La organización revisará el contenido.";
        status.style.color = "#2ecc71";
        setTimeout(cerrarModalReporte, 1500);
    }
};